/**
 * Automation Service — Orchestrator
 * Manages the automation queue, processes jobs sequentially,
 * coordinates adapters, mapping, answer generation, and screenshots.
 */

import { EventEmitter } from 'events';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import os from 'os';

import AutomationRun from '../models/AutomationRun.js';
import SubmittedApplication from '../models/SubmittedApplication.js';
import CandidateProfile from '../models/CandidateProfile.js';
import PreparedApplication from '../models/PreparedApplication.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';

import { getAdapter } from './platformAdapters.js';
import { mapFieldsToProfile } from './formMappingEngine.js';
import { generateAnswer } from './answerGenerationService.js';
import { captureFullPage, captureViewport, highlightFilledFields } from './screenshotService.js';
import { chatJson, FAST_MODEL } from './jobGroqService.js';

// Global event emitter for SSE progress updates
export const automationEvents = new EventEmitter();
automationEvents.setMaxListeners(50);

// ─── Emit progress event to SSE subscribers ─────────────────────────
function emit(runId, event, data) {
  automationEvents.emit(`run:${runId}`, { event, data, timestamp: new Date().toISOString() });
}

function addLog(jobEntry, level, message) {
  jobEntry.automationLog.push({ timestamp: new Date(), level, message });
}

function getActivePage(context, fallbackPage) {
  if (!context) return fallbackPage;
  try {
    const pages = context.pages();
    if (pages.length === 0) return fallbackPage;
    // Find the last page that is not closed and has a valid URL
    for (let i = pages.length - 1; i >= 0; i--) {
      const p = pages[i];
      if (!p.isClosed() && p.url() && p.url() !== 'about:blank') {
        return p;
      }
    }
  } catch (err) {
    console.warn('[Automation] Error getting active page:', err.message);
  }
  return fallbackPage;
}

// ─── Download resume PDF to temp file for upload ────────────────────
async function downloadResumeToTemp(resumeUrl) {
  if (!resumeUrl) return null;
  try {
    const response = await fetch(resumeUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const tmpPath = path.join(os.tmpdir(), `resume_${Date.now()}.pdf`);
    fs.writeFileSync(tmpPath, buffer);
    return tmpPath;
  } catch (err) {
    console.error('[Automation] Failed to download resume:', err.message);
    return null;
  }
}

function cleanupTempFile(filePath) {
  try { if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); }
  catch { /* ignore cleanup errors */ }
}

// ─── CAPTCHA Detection ──────────────────────────────────────────────
async function detectCaptcha(page) {
  try {
    const hasCaptcha = await page.evaluate(() => {
      // 1. Check title for Cloudflare verification
      const title = document.title;
      if (title.includes('Just a moment...') || title.includes('Please wait...')) {
        return true;
      }

      // 2. Check for Cloudflare specific elements
      if (document.querySelector('#challenge-form') || 
          document.querySelector('#challenge-running') ||
          document.querySelector('#cf-challenge') ||
          document.querySelector('iframe[src*="turnstile"]') ||
          document.querySelector('iframe[src*="challenge"]')) {
        return true;
      }

      // 3. Check for reCAPTCHA/hCaptcha elements
      if (document.querySelector('iframe[src*="recaptcha"]') ||
          document.querySelector('iframe[src*="hcaptcha"]') ||
          document.querySelector('.g-recaptcha') ||
          document.querySelector('.h-captcha')) {
        return true;
      }

      // 4. Check visible text for human verification prompts
      const bodyText = document.body.innerText.toLowerCase();
      if (bodyText.includes('verify you are human') || 
          bodyText.includes('verify you are a human') || 
          bodyText.includes('checking if the site connection is secure') ||
          bodyText.includes('checking your browser before accessing') ||
          bodyText.includes('enable javascript and cookies') ||
          bodyText.includes('i am not a robot')) {
        return true;
      }

      // 5. Look for standard captcha input wrappers (only if visible)
      const capInput = document.querySelector('[class*="captcha" i], [id*="captcha" i]');
      if (capInput) {
        // Ensure it is visible
        const rect = capInput.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && window.getComputedStyle(capInput).display !== 'none') {
          return true;
        }
      }

      return false;
    });
    return hasCaptcha;
  } catch {
    return false;
  }
}

// ─── Browser Session Manager for CAPTCHAs ───────────────────────────
if (!global.__activeSessions) {
  global.__activeSessions = new Map();
}
if (!global.__activeBrowsers) {
  global.__activeBrowsers = new Map();
}

export function startCaptchaMonitor(runId, jobIndex, page, context) {
  const sessionKey = `${runId}_${jobIndex}`;
  clearCaptchaSession(sessionKey);

  // 1. Polling check (every 2.5 seconds) to automatically detect captcha resolution
  const monitorInterval = setInterval(async () => {
    try {
      const run = await AutomationRun.findById(runId);
      if (!run) {
        clearCaptchaSession(sessionKey);
        return;
      }

      const jobEntry = run.jobs[jobIndex];
      // Stop monitoring if job status changed, or run is cancelled/deleted
      if (!jobEntry || jobEntry.status !== 'CAPTCHA_REQUIRED' || run.status === 'cancelled') {
        clearCaptchaSession(sessionKey);
        return;
      }

      const allClosed = context.pages().length === 0 || context.pages().every(p => p.isClosed());
      if (allClosed) {
        await handleCaptchaTimeout(runId, jobIndex, 'Browser tab closed by user.');
        return;
      }

      const activePage = getActivePage(context, page);
      const isSolved = await activePage.evaluate(() => {
        // reCAPTCHA
        const recaptcha = document.querySelector('#g-recaptcha-response')?.value || 
                          (window.grecaptcha && typeof window.grecaptcha.getResponse === 'function' ? window.grecaptcha.getResponse() : '');
        if (recaptcha && recaptcha.length > 0) return true;

        // hCaptcha
        const hcaptcha = document.querySelector('[name="h-captcha-response"]')?.value || 
                         document.querySelector('#h-captcha-response')?.value ||
                         (window.hcaptcha && typeof window.hcaptcha.getResponse === 'function' ? window.hcaptcha.getResponse() : '');
        if (hcaptcha && hcaptcha.length > 0) return true;

        // Turnstile
        const turnstile = document.querySelector('[name="cf-turnstile-response"]')?.value || 
                          document.querySelector('#cf-turnstile-response')?.value;
        if (turnstile && turnstile.length > 0) return true;

        // Arkose Labs
        const arkose = document.querySelector('[name*="arkose"]')?.value || 
                       document.querySelector('[id*="arkose"] input')?.value;
        if (arkose && arkose.length > 0) return true;

        // Generic checks: Cap iframe gone and normal form fields visible
        const capIframe = document.querySelector('iframe[src*="captcha"], iframe[src*="turnstile"], iframe[src*="challenge"]');
        const formFields = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
        const url = window.location.href.toLowerCase();
        if (!capIframe && formFields.length > 0 && !url.includes('captcha') && !url.includes('challenge')) {
          return true;
        }

        return false;
      });

      if (isSolved) {
        console.log(`[Captcha Monitor] Solve detected for ${sessionKey}. Resuming autofill...`);
        clearCaptchaSession(sessionKey);
        await resumeAutofillAfterCaptcha(runId, jobIndex);
      }
    } catch (err) {
      console.warn(`[Captcha Monitor] Error in polling loop for ${sessionKey}:`, err.message);
    }
  }, 2500);

  // 2. 10-minute timeout handler (600,000 ms)
  const timeoutId = setTimeout(async () => {
    console.log(`[Captcha Monitor] 10 minutes exceeded for ${sessionKey}. Pausing...`);
    await handleCaptchaTimeout(runId, jobIndex, 'CAPTCHA verification timed out (10 minutes elapsed).');
  }, 600000);

  global.__activeSessions.set(sessionKey, {
    page,
    context,
    monitorInterval,
    timeoutId,
    startedAt: new Date()
  });
}

export function clearCaptchaSession(sessionKey) {
  const session = global.__activeSessions.get(sessionKey);
  if (session) {
    clearInterval(session.monitorInterval);
    clearTimeout(session.timeoutId);
    global.__activeSessions.delete(sessionKey);
  }
}

export async function closeBrowserIfDone(runId) {
  const run = await AutomationRun.findById(runId);
  if (!run) return;

  const hasActiveJobs = run.jobs.some(j =>
    ['PENDING', 'STARTING', 'OPENING_APPLICATION', 'DETECTING_FIELDS', 'MAPPING_FIELDS',
     'UPLOADING_RESUME', 'GENERATING_ANSWERS', 'FILLING_FORM', 'CAPTCHA_REQUIRED',
     'USER_VERIFIED', 'REVIEW_REQUIRED', 'SUBMITTING', 'queued', 'detecting', 'filling',
     'uploading', 'generating_answers', 'awaiting_approval', 'approved', 'captcha_detected'].includes(j.status)
  );

  if (!hasActiveJobs) {
    const browser = global.__activeBrowsers?.get(runId.toString());
    if (browser) {
      console.log(`[Automation] No active jobs left for run ${runId}. Closing browser.`);
      try { await browser.close(); } catch { /* ignore */ }
      global.__activeBrowsers.delete(runId.toString());
    }
  }
}

async function handleCaptchaTimeout(runId, jobIndex, reason) {
  const sessionKey = `${runId}_${jobIndex}`;
  clearCaptchaSession(sessionKey);

  const run = await AutomationRun.findById(runId);
  if (!run) return;

  const jobEntry = run.jobs[jobIndex];
  if (jobEntry && jobEntry.status === 'CAPTCHA_REQUIRED') {
    jobEntry.status = 'FAILED';
    jobEntry.errorDetails = {
      type: 'captcha_timeout',
      message: reason,
      recoverable: true
    };
    addLog(jobEntry, 'error', `Verification failed: ${reason}`);
    run.progress.failed += 1;
    run.status = 'paused';
    await run.save();

    emit(runId, 'job_failed', { index: jobIndex, error: reason });
    emit(runId, 'run_updated', { status: 'paused' });
  }

  const pageRef = global.__automationPages?.[sessionKey];
  if (pageRef) {
    try { await pageRef.context.close(); } catch { /* ignore */ }
    delete global.__automationPages[sessionKey];
  }
  await closeBrowserIfDone(runId);
}

// ═════════════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR
// ═════════════════════════════════════════════════════════════════════

/**
 * Start processing an automation run.
 * Iterates through queued jobs sequentially.
 */
export async function startAutomationRun(runId) {
  const run = await AutomationRun.findById(runId);
  if (!run) throw new Error('Automation run not found');

  run.status = 'running';
  run.startedAt = new Date();
  run.progress.total = run.jobs.length;
  await run.save();
  emit(runId, 'run_started', { total: run.jobs.length });

  let browser;
  try {
    browser = await chromium.launch({
      headless: process.env.PLAYWRIGHT_HEADLESS === 'true',
      timeout: 15000,
      args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
    });
    if (!global.__activeBrowsers) {
      global.__activeBrowsers = new Map();
    }
    global.__activeBrowsers.set(runId.toString(), browser);

    for (let i = 0; i < run.jobs.length; i++) {
      // Re-fetch run to get latest state (in case of cancel)
      const freshRun = await AutomationRun.findById(runId);
      if (!freshRun || freshRun.status === 'cancelled') {
        emit(runId, 'run_cancelled', {});
        return;
      }

      const jobEntry = freshRun.jobs[i];
      if (jobEntry.status !== 'queued' && jobEntry.status !== 'PENDING') {
        continue;
      }

      freshRun.progress.currentIndex = i;
      await freshRun.save();
      emit(runId, 'job_started', { index: i, job: jobEntry.jobInfo });

      try {
        await processJob(browser, freshRun, i);
      } catch (err) {
        console.error(`[Automation] Job ${i} failed:`, err.message);
        const errRun = await AutomationRun.findById(runId);
        errRun.jobs[i].status = 'FAILED';
        errRun.jobs[i].errorDetails = {
          type: 'processing_error',
          message: err.message,
          recoverable: true
        };
        addLog(errRun.jobs[i], 'error', `Failed: ${err.message}`);
        errRun.progress.failed += 1;
        await errRun.save();
        emit(runId, 'job_failed', { index: i, error: err.message });
      }
    }

    // All jobs processed
    const finalRun = await AutomationRun.findById(runId);
    if (finalRun && finalRun.status !== 'cancelled') {
      const allDone = finalRun.jobs.every(j =>
        ['SUBMITTED', 'FAILED', 'skipped', 'submitted', 'failed'].includes(j.status)
      );
      if (allDone) {
        const anyFailed = finalRun.jobs.some(j => ['FAILED', 'failed'].includes(j.status));
        const anySubmitted = finalRun.jobs.some(j => ['SUBMITTED', 'submitted'].includes(j.status));
        if (anyFailed && anySubmitted) {
          finalRun.status = 'PARTIALLY_COMPLETED';
        } else if (anyFailed) {
          finalRun.status = 'failed';
        } else {
          finalRun.status = 'completed';
        }
        finalRun.completedAt = new Date();
      } else {
        finalRun.status = 'paused'; // Some jobs awaiting approval
      }
      await finalRun.save();
      emit(runId, 'run_updated', { status: finalRun.status });
    }
  } catch (err) {
    console.error('[Automation] Run-level error:', err.message);
    const errRun = await AutomationRun.findById(runId);
    if (errRun) {
      errRun.status = 'failed';
      await errRun.save();
    }
    emit(runId, 'run_failed', { error: err.message });
  } finally {
    const freshRun = await AutomationRun.findById(runId);
    const hasActiveJobs = freshRun?.jobs.some(j =>
      ['PENDING', 'STARTING', 'OPENING_APPLICATION', 'DETECTING_FIELDS', 'MAPPING_FIELDS',
       'UPLOADING_RESUME', 'GENERATING_ANSWERS', 'FILLING_FORM', 'CAPTCHA_REQUIRED',
       'USER_VERIFIED', 'REVIEW_REQUIRED', 'SUBMITTING', 'queued', 'detecting', 'filling',
       'uploading', 'generating_answers', 'awaiting_approval', 'approved', 'captcha_detected'].includes(j.status)
    );
    if (!hasActiveJobs && browser) {
      console.log(`[Automation] No active jobs left for run ${runId}. Closing browser in finally.`);
      try { await browser.close(); } catch { /* ignore */ }
      if (global.__activeBrowsers) {
        global.__activeBrowsers.delete(runId.toString());
      }
    } else {
      console.log(`[Automation] Active jobs exist for run ${runId}. Keeping browser open.`);
    }
  }
}

/**
 * Process a single job: detect → fill → upload → screenshot → pause for approval.
 */
async function processJob(browser, run, jobIndex) {
  const jobEntry = run.jobs[jobIndex];
  const applyLink = jobEntry.jobInfo.applyLink;
  if (!applyLink) {
    jobEntry.status = 'FAILED';
    jobEntry.errorDetails = { type: 'no_link', message: 'No apply link available', recoverable: false };
    addLog(jobEntry, 'error', 'No apply link provided');
    await run.save();
    return;
  }

  // Load candidate profile and resume analysis
  const profile = await CandidateProfile.findOne({ userEmail: run.userEmail });
  const resumeAnalysis = await ResumeAnalysis.findOne({ userEmail: run.userEmail });

  // ── Dealbreaker Check ───────────────────────────────────────────
  if (profile && profile.dealbreakers) {
    const db = profile.dealbreakers;
    const jInfo = jobEntry.jobInfo;
    const descLower = (jInfo.description || '').toLowerCase();
    const typeLower = (jInfo.employmentType || '').toLowerCase();
    const locLower = (jInfo.location || '').toLowerCase();
    const compLower = (jInfo.company || '').toLowerCase();
    
    let skipReason = null;

    if (db.minSalary && jInfo.salaryMax !== null && jInfo.salaryMax < db.minSalary) {
      skipReason = `Maximum salary (${jInfo.salaryMax}) is below dealbreaker minimum (${db.minSalary})`;
    } else if (db.remoteOnly && !(locLower.includes('remote') || typeLower.includes('remote'))) {
      skipReason = 'Job is not explicitly marked as Remote';
    } else if (db.noVisaSponsorship && (descLower.includes('does not sponsor') || descLower.includes('will not sponsor') || descLower.includes('cannot sponsor') || descLower.includes('no visa sponsorship') || descLower.includes('no h1b'))) {
      skipReason = 'Job description indicates no visa sponsorship';
    } else if (db.noStaffingAgencies && (compLower.includes('staffing') || compLower.includes('recruiting') || compLower.includes('talent') || compLower.includes('consulting') || compLower.includes('solutions'))) {
      skipReason = 'Company appears to be a staffing/recruiting agency';
    }

    if (skipReason) {
      jobEntry.status = 'skipped';
      addLog(jobEntry, 'warn', `Skipped due to Dealbreaker: ${skipReason}`);
      run.progress.skipped += 1;
      await run.save();
      emit(run._id, 'job_completed', { index: jobIndex, status: 'skipped', reason: skipReason });
      return;
    }
  }

  // ── Step 1: Detect platform ─────────────────────────────────────
  const adapter = getAdapter(applyLink);
  jobEntry.platform = adapter.name;
  jobEntry.status = 'STARTING';
  jobEntry.startedAt = new Date();
  addLog(jobEntry, 'info', `Platform detected: ${adapter.name}`);
  await run.save();
  emit(run._id, 'job_progress', { index: jobIndex, status: 'STARTING', platform: adapter.name });

  // ── Step 2: Navigate to application page ────────────────────────
  const videoDir = path.join(process.cwd(), 'public', 'videos', run._id.toString());
  fs.mkdirSync(videoDir, { recursive: true });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, Gecko) Chrome/125.0.0.0 Safari/537.36',
    recordVideo: {
      dir: videoDir,
      size: { width: 1280, height: 720 }
    }
  });

  // Anti-bot stealth injections to prevent Cloudflare Turnstile blocks
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined
    });
  });

  const page = await context.newPage();

  let videoRef = null;
  try {
    videoRef = page.video();
  } catch { /* ignore */ }

  try {
    jobEntry.status = 'OPENING_APPLICATION';
    addLog(jobEntry, 'info', `Navigating to ${applyLink}`);
    await run.save();
    emit(run._id, 'job_progress', { index: jobIndex, status: 'OPENING_APPLICATION' });

    await page.goto(applyLink, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1500 + Math.random() * 1000);

    // ── Step 3: Check for CAPTCHA ───────────────────────────────
    if (await detectCaptcha(page)) {
      jobEntry.status = 'CAPTCHA_REQUIRED';
      addLog(jobEntry, 'warn', 'CAPTCHA detected — please solve manually in the browser window, then click Approve & Submit.');
      const screenshot = await captureViewport(page);
      jobEntry.screenshots.error = screenshot;
      jobEntry.errorDetails = {
        type: 'captcha',
        message: 'CAPTCHA detected on application page. Please solve in the open browser window, then approve.',
        recoverable: true
      };
      
      // Store page reference so browser window stays open and can be resumed/submitted
      if (!global.__automationPages) global.__automationPages = {};
      global.__automationPages[`${run._id}_${jobIndex}`] = { page, context };

      await run.save();
      emit(run._id, 'job_progress', { index: jobIndex, status: 'CAPTCHA_REQUIRED' });
      
      // Start polling monitor and timeout
      startCaptchaMonitor(run._id, jobIndex, page, context);
      return;
    }

    // ── Step 4: Scan form fields ──────────────────────────────────
    jobEntry.status = 'DETECTING_FIELDS';
    addLog(jobEntry, 'info', 'Scanning form fields...');
    await run.save();
    emit(run._id, 'job_progress', { index: jobIndex, status: 'DETECTING_FIELDS' });

    const rawFields = await adapter.scanFields(page);
    addLog(jobEntry, 'info', `Found ${rawFields.length} form fields`);

    // ── Step 5: Map fields to profile ─────────────────────────────
    jobEntry.status = 'MAPPING_FIELDS';
    await run.save();
    emit(run._id, 'job_progress', { index: jobIndex, status: 'MAPPING_FIELDS' });

    const mappedFields = mapFieldsToProfile(rawFields, profile);
    jobEntry.detectedFields = mappedFields;

    // ── Step 6: Fill mapped fields ────────────────────────────────
    jobEntry.status = 'FILLING_FORM';
    await run.save();
    emit(run._id, 'job_progress', { index: jobIndex, status: 'FILLING_FORM' });

    let filledCount = 0;
    for (const field of mappedFields) {
      if (field.isCustomQuestion || !field.mappedValue || !field.selector) continue;
      if (field.mappedKey === 'resume' || field.mappedKey === 'cover_letter') continue;

      try {
        const success = await adapter.fillField(page, field.selector, field.mappedValue);
        if (success) {
          filledCount++;
          addLog(jobEntry, 'success', `Filled "${field.label}" → ${field.mappedKey}`);
        }
      } catch (e) {
        addLog(jobEntry, 'warn', `Failed to fill "${field.label}": ${e.message}`);
      }
      await page.waitForTimeout(200 + Math.random() * 300);
    }
    addLog(jobEntry, 'info', `Filled ${filledCount}/${mappedFields.filter(f => !f.isCustomQuestion && f.mappedValue).length} fields`);

    // ── Step 7: Generate answers for custom questions ─────────────
    const customQuestions = mappedFields.filter(f => f.isCustomQuestion && f.label);
    if (customQuestions.length > 0) {
      jobEntry.status = 'GENERATING_ANSWERS';
      await run.save();
      emit(run._id, 'job_progress', { index: jobIndex, status: 'GENERATING_ANSWERS' });

      for (const cq of customQuestions) {
        addLog(jobEntry, 'info', `Generating AI answer for: "${cq.label.slice(0, 60)}..."`);
        try {
          const result = await generateAnswer(
            cq.label,
            profile?.toObject ? profile.toObject() : (profile || {}),
            jobEntry.jobInfo,
            resumeAnalysis?.toObject ? resumeAnalysis.toObject() : resumeAnalysis
          );

          jobEntry.generatedAnswers.push({
            question: cq.label,
            answer: result.answer,
            confidenceScore: result.confidenceScore,
            explanation: result.explanation,
            cached: result.cached
          });

          // Fill the answer into the field
          if (result.answer && cq.selector) {
            await adapter.fillField(page, cq.selector, result.answer);
            addLog(jobEntry, 'success', `AI answer filled for "${cq.label.slice(0, 40)}..." (confidence: ${result.confidenceScore}%)`);
          }
        } catch (e) {
          addLog(jobEntry, 'warn', `Failed to generate answer for "${cq.label.slice(0, 40)}...": ${e.message}`);
        }
        await page.waitForTimeout(300);
      }
    }

    // ── Step 8: Upload resume ─────────────────────────────────────
    jobEntry.status = 'UPLOADING_RESUME';
    await run.save();
    emit(run._id, 'job_progress', { index: jobIndex, status: 'UPLOADING_RESUME' });

    const resumeUrl = profile?.resumeUrl;
    if (resumeUrl) {
      addLog(jobEntry, 'info', 'Downloading resume for upload...');
      const tmpResume = await downloadResumeToTemp(resumeUrl);
      if (tmpResume) {
        const uploaded = await adapter.uploadResume(page, tmpResume);
        addLog(jobEntry, uploaded ? 'success' : 'warn',
          uploaded ? 'Resume uploaded successfully' : 'Resume upload field not found');
        cleanupTempFile(tmpResume);
      }
    }

    // ── Step 9: Pre-submission screenshot ─────────────────────────
    const selectors = mappedFields.filter(f => f.selector).map(f => f.selector);
    await highlightFilledFields(page, selectors);
    await page.waitForTimeout(500);

    const preScreenshot = await captureFullPage(page);
    jobEntry.screenshots.preSubmission = preScreenshot;

    // ── Step 10: Pause for human approval ─────────────────────────
    jobEntry.status = 'REVIEW_REQUIRED';
    addLog(jobEntry, 'info', '⏸ Awaiting human approval before submission');
    await run.save();
    emit(run._id, 'job_awaiting_approval', {
      index: jobIndex,
      fieldCount: mappedFields.length,
      filledCount,
      customAnswers: jobEntry.generatedAnswers.length,
      hasScreenshot: !!preScreenshot
    });

    // The browser context stays open — will be closed by approveAndSubmit or skipJob
    // Store page reference temporarily (in-memory only)
    if (!global.__automationPages) global.__automationPages = {};
    global.__automationPages[`${run._id}_${jobIndex}`] = { page, context };

  } catch (err) {
    try { await context.close(); } catch { /* ignore */ }
    if (videoRef) {
      try {
        const actualPath = await videoRef.path();
        if (actualPath && fs.existsSync(actualPath)) {
          const targetPath = path.join(videoDir, `${jobIndex}.webm`);
          fs.renameSync(actualPath, targetPath);
          jobEntry.videoPath = `/videos/${run._id}/${jobIndex}.webm`;
          await run.save();
        }
      } catch (videoErr) {
        console.warn('[Automation] Video saving failed on process job error:', videoErr.message);
      }
    }
    throw err;
  }
}

// ═════════════════════════════════════════════════════════════════════
// APPROVAL / SKIP / RETRY
// ═════════════════════════════════════════════════════════════════════

/**
 * Approve and submit a specific job after user review.
 */
export async function approveAndSubmit(runId, jobIndex) {
  const run = await AutomationRun.findById(runId);
  if (!run) throw new Error('Run not found');

  const jobEntry = run.jobs[jobIndex];
  if (!jobEntry || !['REVIEW_REQUIRED', 'awaiting_approval'].includes(jobEntry.status)) {
    throw new Error('Job is not awaiting approval');
  }

  const pageRef = global.__automationPages?.[`${runId}_${jobIndex}`];
  if (!pageRef) {
    // Page session expired — need to re-process
    throw new Error('Browser session expired. Please retry this job.');
  }

  const { page, context } = pageRef;
  const activePage = getActivePage(context, page);
  let videoRef = null;
  try {
    videoRef = page.video();
  } catch { /* ignore */ }

  const videoDir = path.join(process.cwd(), 'public', 'videos', runId);

  try {
    jobEntry.status = 'SUBMITTING';
    addLog(jobEntry, 'info', '✓ User approved — applying final edits to form...');
    await run.save();
    emit(runId, 'job_progress', { index: jobIndex, status: 'SUBMITTING' });

    // Detect adapter dynamically based on active page URL
    const activeUrl = activePage.url();
    const adapter = getAdapter(activeUrl || jobEntry.jobInfo.applyLink);

    // Apply any user edits from the database back to the browser form fields
    for (const field of jobEntry.detectedFields) {
      if (field.isCustomQuestion || !field.mappedValue || !field.selector) continue;
      if (field.mappedKey === 'resume' || field.mappedKey === 'cover_letter') continue;
      try {
        await adapter.fillField(activePage, field.selector, field.mappedValue);
      } catch (e) {
        console.warn(`[Automation] Failed to re-fill "${field.label}":`, e.message);
      }
    }

    // Apply custom answers edits
    for (const cq of jobEntry.detectedFields.filter(f => f.isCustomQuestion && f.selector)) {
      const dbAnswer = jobEntry.generatedAnswers.find(a => a.question === cq.label);
      if (dbAnswer && dbAnswer.answer) {
        try {
          await adapter.fillField(activePage, cq.selector, dbAnswer.answer);
        } catch (e) {
          console.warn(`[Automation] Failed to re-fill custom question "${cq.label}":`, e.message);
        }
      }
    }

    addLog(jobEntry, 'info', 'Submitting application form...');
    const submitSel = adapter.getSubmitSelector();

    const submitted = await activePage.evaluate((sel) => {
      const btn = document.querySelector(sel);
      if (btn) { btn.click(); return true; }
      return false;
    }, submitSel);

    if (submitted) {
      await activePage.waitForTimeout(3000);
      const postScreenshot = await captureViewport(activePage);
      jobEntry.screenshots.postSubmission = postScreenshot;
      jobEntry.status = 'SUBMITTED';
      jobEntry.submissionResult = {
        success: true,
        timestamp: new Date(),
        confirmationUrl: activePage.url()
      };
      jobEntry.completedAt = new Date();
      addLog(jobEntry, 'success', '🎉 Application submitted successfully!');
      run.progress.completed += 1;

      // Create SubmittedApplication record
      await createSubmittedApplication(run, jobEntry);

    } else {
      jobEntry.status = 'FAILED';
      jobEntry.errorDetails = {
        type: 'submit_failed',
        message: 'Could not find or click the submit button',
        recoverable: true
      };
      addLog(jobEntry, 'error', 'Submit button not found or not clickable');
      run.progress.failed += 1;
    }

    await run.save();
    emit(runId, 'job_completed', { index: jobIndex, status: jobEntry.status });

  } catch (err) {
    console.error(`[Automation] Submission error for run ${runId} job ${jobIndex}:`, err.message);
    const errRun = await AutomationRun.findById(runId);
    if (errRun && errRun.jobs[jobIndex]) {
      const errJob = errRun.jobs[jobIndex];
      errJob.status = 'FAILED';
      errJob.errorDetails = {
        type: 'submit_error',
        message: err.message,
        recoverable: true
      };
      addLog(errJob, 'error', `Submission failed: ${err.message}`);
      errRun.progress.failed += 1;
      await errRun.save();
    }
    emit(runId, 'job_failed', { index: jobIndex, error: err.message });
  } finally {
    delete global.__automationPages[`${runId}_${jobIndex}`];
    clearCaptchaSession(`${runId}_${jobIndex}`);
    try { await context.close(); } catch { /* ignore */ }

    if (videoRef) {
      try {
        const actualPath = await videoRef.path();
        if (actualPath && fs.existsSync(actualPath)) {
          const targetPath = path.join(videoDir, `${jobIndex}.webm`);
          fs.renameSync(actualPath, targetPath);
          jobEntry.videoPath = `/videos/${runId}/${jobIndex}.webm`;
          await run.save();
        }
      } catch (videoErr) {
        console.warn('[Automation] Video saving failed on submit finally:', videoErr.message);
      }
    }
  }

  // Check if all jobs are done
  await checkRunCompletion(runId);
}

/**
 * Resume automation run from step 4 after CAPTCHA bypass.
 */
export async function resumeAutofillAfterCaptcha(runId, jobIndex) {
  const run = await AutomationRun.findById(runId);
  if (!run) throw new Error('Run not found');

  const jobEntry = run.jobs[jobIndex];
  if (!jobEntry || !['CAPTCHA_REQUIRED', 'captcha_detected'].includes(jobEntry.status)) {
    throw new Error('Job is not in CAPTCHA_REQUIRED state');
  }

  const pageRef = global.__automationPages?.[`${runId}_${jobIndex}`];
  if (!pageRef) {
    throw new Error('Browser session expired. Please retry this job.');
  }

  const { page, context } = pageRef;
  const activePage = getActivePage(context, page);
  const sessionKey = `${runId}_${jobIndex}`;
  clearCaptchaSession(sessionKey);

  const videoDir = path.join(process.cwd(), 'public', 'videos', runId);

  try {
    jobEntry.status = 'USER_VERIFIED';
    addLog(jobEntry, 'success', 'CAPTCHA verified successfully!');
    await run.save();
    emit(runId, 'job_progress', { index: jobIndex, status: 'USER_VERIFIED' });
    await activePage.waitForTimeout(1000);

    jobEntry.status = 'DETECTING_FIELDS';
    addLog(jobEntry, 'info', 'Resuming form autofill after CAPTCHA bypass...');
    await run.save();
    emit(runId, 'job_progress', { index: jobIndex, status: 'DETECTING_FIELDS' });

    // Load candidate profile and resume analysis
    const profile = await CandidateProfile.findOne({ userEmail: run.userEmail });
    const resumeAnalysis = await ResumeAnalysis.findOne({ userEmail: run.userEmail });
    
    // Dynamically detect adapter based on active/redirected URL
    const activeUrl = activePage.url();
    const adapter = getAdapter(activeUrl || jobEntry.jobInfo.applyLink);
    if (activeUrl && activeUrl !== jobEntry.jobInfo.applyLink) {
      addLog(jobEntry, 'info', `Switched view context to redirected page: ${activeUrl}`);
      jobEntry.platform = adapter.name;
    }

    // ── Step 4: Scan form fields ──────────────────────────────────
    addLog(jobEntry, 'info', 'Scanning form fields...');
    const rawFields = await adapter.scanFields(activePage);
    addLog(jobEntry, 'info', `Found ${rawFields.length} form fields`);

    // ── Step 5: Map fields to profile ─────────────────────────────
    jobEntry.status = 'MAPPING_FIELDS';
    await run.save();
    emit(runId, 'job_progress', { index: jobIndex, status: 'MAPPING_FIELDS' });

    const mappedFields = mapFieldsToProfile(rawFields, profile);
    jobEntry.detectedFields = mappedFields;

    // ── Step 6: Fill mapped fields ────────────────────────────────
    jobEntry.status = 'FILLING_FORM';
    await run.save();
    emit(runId, 'job_progress', { index: jobIndex, status: 'FILLING_FORM' });

    let filledCount = 0;
    for (const field of mappedFields) {
      if (field.isCustomQuestion || !field.mappedValue || !field.selector) continue;
      if (field.mappedKey === 'resume' || field.mappedKey === 'cover_letter') continue;

      try {
        const success = await adapter.fillField(activePage, field.selector, field.mappedValue);
        if (success) {
          filledCount++;
          addLog(jobEntry, 'success', `Filled "${field.label}" → ${field.mappedKey}`);
        }
      } catch (e) {
        addLog(jobEntry, 'warn', `Failed to fill "${field.label}": ${e.message}`);
      }
      await activePage.waitForTimeout(200 + Math.random() * 300);
    }

    // ── Step 7: Generate answers for custom questions ─────────────
    const customQuestions = mappedFields.filter(f => f.isCustomQuestion && f.label);
    if (customQuestions.length > 0) {
      jobEntry.status = 'GENERATING_ANSWERS';
      await run.save();
      emit(runId, 'job_progress', { index: jobIndex, status: 'GENERATING_ANSWERS' });

      for (const cq of customQuestions) {
        addLog(jobEntry, 'info', `Generating AI answer for: "${cq.label.slice(0, 60)}..."`);
        try {
          const result = await generateAnswer(
            cq.label,
            profile?.toObject ? profile.toObject() : (profile || {}),
            jobEntry.jobInfo,
            resumeAnalysis?.toObject ? resumeAnalysis.toObject() : resumeAnalysis
          );

          jobEntry.generatedAnswers.push({
            question: cq.label,
            answer: result.answer,
            confidenceScore: result.confidenceScore,
            explanation: result.explanation,
            cached: result.cached
          });

          if (result.answer && cq.selector) {
            await adapter.fillField(activePage, cq.selector, result.answer);
            addLog(jobEntry, 'success', `AI answer filled for "${cq.label.slice(0, 40)}..." (confidence: ${result.confidenceScore}%)`);
          }
        } catch (e) {
          addLog(jobEntry, 'warn', `Failed to generate answer for "${cq.label.slice(0, 40)}...": ${e.message}`);
        }
        await activePage.waitForTimeout(300);
      }
    }

    // ── Step 8: Upload resume ─────────────────────────────────────
    jobEntry.status = 'UPLOADING_RESUME';
    await run.save();
    emit(runId, 'job_progress', { index: jobIndex, status: 'UPLOADING_RESUME' });

    const resumeUrl = profile?.resumeUrl;
    if (resumeUrl) {
      addLog(jobEntry, 'info', 'Downloading resume for upload...');
      const tmpResume = await downloadResumeToTemp(resumeUrl);
      if (tmpResume) {
        const uploaded = await adapter.uploadResume(activePage, tmpResume);
        addLog(jobEntry, uploaded ? 'success' : 'warn',
          uploaded ? 'Resume uploaded successfully' : 'Resume upload field not found');
        cleanupTempFile(tmpResume);
      }
    }

    // ── Step 9: Pre-submission screenshot ─────────────────────────
    const selectors = mappedFields.filter(f => f.selector).map(f => f.selector);
    await highlightFilledFields(activePage, selectors);
    await activePage.waitForTimeout(500);

    const preScreenshot = await captureFullPage(activePage);
    jobEntry.screenshots.preSubmission = preScreenshot;

    // ── Step 10: Pause for human approval ─────────────────────────
    jobEntry.status = 'REVIEW_REQUIRED';
    jobEntry.errorDetails = null; // Clear captcha error
    addLog(jobEntry, 'info', '⏸ Awaiting human approval before submission');
    await run.save();
    emit(run._id, 'job_awaiting_approval', {
      index: jobIndex,
      fieldCount: mappedFields.length,
      filledCount,
      customAnswers: jobEntry.generatedAnswers.length,
      hasScreenshot: !!preScreenshot
    });

  } catch (err) {
    console.error(`[Automation] Error resuming after captcha:`, err.message);
    jobEntry.status = 'FAILED';
    jobEntry.errorDetails = {
      type: 'captcha_resume_error',
      message: err.message,
      recoverable: true
    };
    addLog(jobEntry, 'error', `Failed to resume autofill: ${err.message}`);
    await run.save();
    emit(runId, 'job_failed', { index: jobIndex, error: err.message });
    // Clean up browser context on error
    delete global.__automationPages[sessionKey];
    try { await context.close(); } catch { /* ignore */ }
    
    // Video capture on error
    let videoRef = null;
    try { videoRef = page.video(); } catch {}
    if (videoRef) {
      try {
        const actualPath = await videoRef.path();
        if (actualPath && fs.existsSync(actualPath)) {
          const targetPath = path.join(videoDir, `${jobIndex}.webm`);
          fs.renameSync(actualPath, targetPath);
          jobEntry.videoPath = `/videos/${runId}/${jobIndex}.webm`;
          await run.save();
        }
      } catch (videoErr) {
        console.warn('[Automation] Video saving failed on resume crash:', videoErr.message);
      }
    }
  }
}

/**
 * Skip a job in the queue.
 */
export async function skipJob(runId, jobIndex) {
  const run = await AutomationRun.findById(runId);
  if (!run) throw new Error('Run not found');

  run.jobs[jobIndex].status = 'skipped';
  addLog(run.jobs[jobIndex], 'info', 'Job skipped by user');
  run.progress.skipped += 1;
  await run.save();

  // Clean up browser session if exists
  const pageRef = global.__automationPages?.[`${runId}_${jobIndex}`];
  if (pageRef) {
    try { await pageRef.context.close(); } catch { /* ignore */ }
    delete global.__automationPages[`${runId}_${jobIndex}`];
  }

  emit(runId, 'job_skipped', { index: jobIndex });
  clearCaptchaSession(`${runId}_${jobIndex}`);
  await checkRunCompletion(runId);
}

/**
 * Cancel the entire automation run.
 */
export async function cancelRun(runId) {
  const run = await AutomationRun.findById(runId);
  if (!run) throw new Error('Run not found');

  run.status = 'cancelled';
  run.completedAt = new Date();

  // Close all open browser sessions
  for (let i = 0; i < run.jobs.length; i++) {
    const key = `${runId}_${i}`;
    clearCaptchaSession(key);
    const ref = global.__automationPages?.[key];
    if (ref) {
      try { await ref.context.close(); } catch { /* ignore */ }
      delete global.__automationPages[key];
    }
    if (run.jobs[i].status === 'queued' || run.jobs[i].status === 'PENDING' || run.jobs[i].status === 'CAPTCHA_REQUIRED' || run.jobs[i].status === 'REVIEW_REQUIRED' || run.jobs[i].status === 'awaiting_approval') {
      run.jobs[i].status = 'skipped';
    }
  }

  await run.save();
  emit(runId, 'run_cancelled', {});

  const browser = global.__activeBrowsers?.get(runId.toString());
  if (browser) {
    console.log(`[Automation] Run cancelled. Closing browser for run ${runId}.`);
    try { await browser.close(); } catch { /* ignore */ }
    global.__activeBrowsers.delete(runId.toString());
  }
}

/**
 * Retry a failed or captcha-detected job.
 */
export async function retryJob(runId, jobIndex) {
  const run = await AutomationRun.findById(runId);
  if (!run) throw new Error('Run not found');

  const jobEntry = run.jobs[jobIndex];
  if (!jobEntry) throw new Error('Job not found');

  if (!['failed', 'captcha_detected'].includes(jobEntry.status)) {
    throw new Error('Only failed or captcha-detected jobs can be retried');
  }

  // Clean up browser session if exists
  const pageRef = global.__automationPages?.[`${runId}_${jobIndex}`];
  if (pageRef) {
    try { await pageRef.context.close(); } catch { /* ignore */ }
    delete global.__automationPages[`${runId}_${jobIndex}`];
  }

  // If it was failed, decrement failed count
  if (jobEntry.status === 'failed' && run.progress.failed > 0) {
    run.progress.failed -= 1;
  }

  // Reset job status
  jobEntry.status = 'queued';
  jobEntry.errorDetails = null;
  if (jobEntry.screenshots) {
    jobEntry.screenshots.error = null;
  }
  
  addLog(jobEntry, 'info', 'Retrying job automation...');
  await run.save();

  emit(runId, 'job_retried', { index: jobIndex });

  // Fire off startAutomationRun in background
  startAutomationRun(runId).catch(err => {
    console.error(`[Automation] Error running retried run:`, err.message);
  });

  return run;
}

// ─── Helpers ────────────────────────────────────────────────────────

async function checkRunCompletion(runId) {
  const run = await AutomationRun.findById(runId);
  if (!run) return;

  const allDone = run.jobs.every(j =>
    ['submitted', 'failed', 'skipped', 'SUBMITTED', 'FAILED'].includes(j.status)
  );
  if (allDone) {
    run.status = 'completed';
    run.completedAt = new Date();
    await run.save();
    emit(runId, 'run_completed', {
      completed: run.progress.completed,
      failed: run.progress.failed,
      skipped: run.progress.skipped
    });

    const browser = global.__activeBrowsers?.get(runId.toString());
    if (browser) {
      console.log(`[Automation] Run completed. Closing browser for run ${runId}.`);
      try { await browser.close(); } catch { /* ignore */ }
      global.__activeBrowsers.delete(runId.toString());
    }
  }
}

async function createSubmittedApplication(run, jobEntry) {
  try {
    const profile = await CandidateProfile.findOne({ userEmail: run.userEmail });

    // Generate AI prediction post-submission
    let aiPrediction = {};
    try {
      aiPrediction = await chatJson(
        `You are an elite technical recruiter. Predict the outcome of this job application. Return ONLY valid JSON:
{
  "interviewProbability": number (0-100),
  "shortlistingProbability": number (0-100),
  "resumeStrengthAnalysis": "string",
  "strongestSellingPoints": ["string"],
  "biggestWeaknesses": ["string"],
  "suggestedFollowUpActions": ["string"],
  "applySuccessPredictionScore": number (0-100),
  "recruiterComment": "string"
}`,
        `JOB: ${jobEntry.jobInfo.title} at ${jobEntry.jobInfo.company}
DESCRIPTION: ${(jobEntry.jobInfo.description || '').slice(0, 3000)}
CANDIDATE SKILLS: ${(profile?.skills || []).join(', ')}
MATCH SCORE: ${jobEntry.matchScore || 'N/A'}
SUBMITTED ANSWERS: ${JSON.stringify(jobEntry.generatedAnswers.map(a => ({ q: a.question, confidence: a.confidenceScore })))}`,
        FAST_MODEL, 0.3
      );
    } catch (e) {
      console.warn('[Automation] AI prediction failed:', e.message);
    }

    await SubmittedApplication.create({
      userEmail: run.userEmail,
      jobId: jobEntry.jobId,
      automationRunId: run._id,
      jobInfo: jobEntry.jobInfo,
      submissionDate: new Date(),
      applicationUrl: jobEntry.submissionResult?.confirmationUrl,
      confirmationScreenshot: jobEntry.screenshots.postSubmission,
      resumeVersionUrl: profile?.resumeUrl,
      generatedAnswers: jobEntry.generatedAnswers,
      matchScore: jobEntry.matchScore,
      applyReadinessScore: jobEntry.applyReadinessScore,
      aiPrediction,
      status: 'submitted',
      timeline: [{ date: new Date(), event: 'Application Submitted', details: `Automated submission to ${jobEntry.jobInfo.company}` }]
    });
  } catch (err) {
    console.error('[Automation] Failed to create SubmittedApplication:', err.message);
  }
}
