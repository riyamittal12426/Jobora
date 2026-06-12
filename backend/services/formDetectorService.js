import { chromium } from 'playwright';

const GREENHOUSE_TEMPLATE = [
  { id: 'first_name', name: 'first_name', type: 'text', label: 'First Name', required: true },
  { id: 'last_name', name: 'last_name', type: 'text', label: 'Last Name', required: true },
  { id: 'email', name: 'email', type: 'email', label: 'Email', required: true },
  { id: 'phone', name: 'phone', type: 'tel', label: 'Phone', required: true },
  { id: 'resume', name: 'resume', type: 'file', label: 'Resume/CV', required: true },
  { id: 'cover_letter', name: 'cover_letter', type: 'file', label: 'Cover Letter', required: false },
  { id: 'linkedin', name: 'linkedin', type: 'text', label: 'LinkedIn Profile URL', required: false },
  { id: 'github', name: 'github', type: 'text', label: 'GitHub Profile URL', required: false },
  { id: 'portfolio', name: 'portfolio', type: 'text', label: 'Portfolio URL', required: false }
];

const LEVER_TEMPLATE = [
  { id: 'resume', name: 'resume', type: 'file', label: 'Resume/CV', required: true },
  { id: 'name', name: 'name', type: 'text', label: 'Full Name', required: true },
  { id: 'email', name: 'email', type: 'email', label: 'Email', required: true },
  { id: 'phone', name: 'phone', type: 'tel', label: 'Phone', required: true },
  { id: 'org', name: 'org', type: 'text', label: 'Current Company', required: false },
  { id: 'linkedin', name: 'urls[LinkedIn]', type: 'text', label: 'LinkedIn URL', required: false },
  { id: 'github', name: 'urls[GitHub]', type: 'text', label: 'GitHub URL', required: false },
  { id: 'portfolio', name: 'urls[Portfolio]', type: 'text', label: 'Portfolio URL', required: false }
];

const STANDARD_TEMPLATE = [
  { id: 'name', name: 'name', type: 'text', label: 'Full Name', required: true },
  { id: 'email', name: 'email', type: 'email', label: 'Email Address', required: true },
  { id: 'phone', name: 'phone', type: 'tel', label: 'Phone Number', required: true },
  { id: 'resume', name: 'resume', type: 'file', label: 'Upload Resume', required: true },
  { id: 'linkedin', name: 'linkedin', type: 'text', label: 'LinkedIn URL', required: false },
  { id: 'github', name: 'github', type: 'text', label: 'GitHub URL', required: false },
  { id: 'portfolio', name: 'portfolio', type: 'text', label: 'Portfolio URL', required: false }
];

export async function detectFormFields(jobUrl) {
  let portal = 'standard';
  const urlLower = (jobUrl || '').toLowerCase();
  
  if (urlLower.includes('greenhouse.io')) {
    portal = 'greenhouse';
  } else if (urlLower.includes('lever.co')) {
    portal = 'lever';
  } else if (urlLower.includes('workday')) {
    portal = 'workday';
  }

  // Fallback structures if playwright fails
  const getFallback = () => {
    if (portal === 'greenhouse') return { portal, fields: GREENHOUSE_TEMPLATE };
    if (portal === 'lever') return { portal, fields: LEVER_TEMPLATE };
    return { portal, fields: STANDARD_TEMPLATE };
  };

  if (!jobUrl || !jobUrl.startsWith('http')) {
    return getFallback();
  }

  let browser;
  try {
    // Attempt chromium launch - might fail if browser binaries aren't installed via Playwright CLI
    browser = await chromium.launch({ headless: true, timeout: 5000 });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log(`[Playwright Form Detector] Scanning ${jobUrl}...`);
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });

    const fields = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
      
      return inputs.map(el => {
        const type = el.tagName.toLowerCase() === 'textarea' ? 'textarea' : el.type || 'text';
        
        // Find corresponding label text
        let labelText = '';
        if (el.id) {
          const labelEl = document.querySelector(`label[for="${el.id}"]`);
          if (labelEl) labelText = labelEl.textContent.trim();
        }
        if (!labelText) {
          const parentLabel = el.closest('label');
          if (parentLabel) labelText = parentLabel.textContent.trim();
        }
        if (!labelText) {
          // Check placeholder or aria-label
          labelText = el.placeholder || el.getAttribute('aria-label') || el.name || el.id || '';
        }

        // Clean up whitespace/asterisk from label
        labelText = labelText.replace(/\s*\*$/, '').trim();

        return {
          id: el.id || '',
          name: el.name || '',
          type: type,
          placeholder: el.placeholder || '',
          label: labelText || el.name || el.id || 'Field',
          required: el.required || el.hasAttribute('required') || false
        };
      }).filter(f => f.name || f.id);
    });

    await browser.close();
    
    if (fields.length === 0) {
      console.log('[Playwright Form Detector] No input elements found, returning fallback template.');
      return getFallback();
    }

    return { portal, fields };
  } catch (error) {
    console.warn('[Playwright Form Detector] Failed to launch/navigate, falling back to templates.', error.message);
    if (browser) {
      try { await browser.close(); } catch (_) {}
    }
    return getFallback();
  }
}
