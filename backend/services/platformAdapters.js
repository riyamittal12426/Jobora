/**
 * Platform Adapters
 * Each adapter defines how to interact with a specific job portal.
 * Adapters implement: detect, getFormFields, fillField, uploadResume, getSubmitSelector, validate.
 */

import { classifyField, resolveValue } from './formMappingEngine.js';

// ─── Helper: Human-like typing delay ────────────────────────────────
async function humanType(page, selector, text, options = {}) {
  const el = await page.$(selector);
  if (!el) return false;
  await el.click();
  await page.waitForTimeout(100 + Math.random() * 200);
  await el.fill('');
  await el.type(text, { delay: 30 + Math.random() * 50 });
  return true;
}

async function safeClick(page, selector, timeout = 3000) {
  try {
    await page.waitForSelector(selector, { timeout });
    await page.click(selector);
    return true;
  } catch { return false; }
}

// ═════════════════════════════════════════════════════════════════════
// GREENHOUSE ADAPTER
// ═════════════════════════════════════════════════════════════════════
const GreenhouseAdapter = {
  name: 'greenhouse',

  detect(url) {
    const u = (url || '').toLowerCase();
    return u.includes('greenhouse.io') || u.includes('boards.greenhouse');
  },

  async scanFields(page) {
    return page.evaluate(() => {
      const fields = [];
      document.querySelectorAll('.field, .application-field, [class*="field"]').forEach(container => {
        const label = container.querySelector('label');
        const input = container.querySelector('input, textarea, select');
        if (input) {
          fields.push({
            selector: input.id ? `#${input.id}` : `[name="${input.name}"]`,
            id: input.id || '',
            name: input.name || '',
            type: input.type || input.tagName.toLowerCase(),
            label: (label?.textContent || input.placeholder || input.name || '').replace(/\s*\*$/, '').trim(),
            placeholder: input.placeholder || '',
            required: input.required || container.classList.contains('required')
          });
        }
      });
      // Also scan standalone inputs not inside .field containers
      document.querySelectorAll('input:not([type="hidden"]), textarea, select').forEach(input => {
        const exists = fields.some(f => f.selector === (input.id ? `#${input.id}` : `[name="${input.name}"]`));
        if (!exists && (input.name || input.id)) {
          const parentLabel = input.closest('label') || document.querySelector(`label[for="${input.id}"]`);
          fields.push({
            selector: input.id ? `#${input.id}` : `[name="${input.name}"]`,
            id: input.id || '',
            name: input.name || '',
            type: input.type || input.tagName.toLowerCase(),
            label: (parentLabel?.textContent || input.placeholder || input.name || '').replace(/\s*\*$/, '').trim(),
            placeholder: input.placeholder || '',
            required: input.required
          });
        }
      });
      return fields;
    });
  },

  async fillField(page, selector, value) {
    return humanType(page, selector, value);
  },

  async uploadResume(page, filePath) {
    const sel = 'input[type="file"][name*="resume"], input[type="file"][id*="resume"], input[type="file"]';
    try {
      const fileInput = await page.$(sel);
      if (fileInput) {
        await fileInput.setInputFiles(filePath);
        return true;
      }
    } catch (e) { console.warn('[Greenhouse] Resume upload failed:', e.message); }
    return false;
  },

  getSubmitSelector() {
    return 'input[type="submit"], button[type="submit"], #submit_app, [data-test="submit-application"]';
  },

  async validate(page) {
    const issues = [];
    const required = await page.$$('.field.required input:invalid, .field.required textarea:invalid');
    if (required.length > 0) issues.push(`${required.length} required field(s) not filled`);
    return { valid: issues.length === 0, issues };
  }
};

// ═════════════════════════════════════════════════════════════════════
// LEVER ADAPTER
// ═════════════════════════════════════════════════════════════════════
const LeverAdapter = {
  name: 'lever',

  detect(url) {
    return (url || '').toLowerCase().includes('lever.co');
  },

  async scanFields(page) {
    return page.evaluate(() => {
      const fields = [];
      document.querySelectorAll('.application-field, .application-question').forEach(container => {
        const label = container.querySelector('label, .field-label');
        const input = container.querySelector('input, textarea, select');
        if (input) {
          fields.push({
            selector: input.id ? `#${input.id}` : `[name="${input.name}"]`,
            id: input.id || '',
            name: input.name || '',
            type: input.type || input.tagName.toLowerCase(),
            label: (label?.textContent || input.placeholder || input.name || '').replace(/\s*\*$/, '').trim(),
            placeholder: input.placeholder || '',
            required: input.required
          });
        }
      });
      return fields;
    });
  },

  async fillField(page, selector, value) {
    return humanType(page, selector, value);
  },

  async uploadResume(page, filePath) {
    try {
      const fileInput = await page.$('input[type="file"][name*="resume"], input[type="file"]');
      if (fileInput) {
        await fileInput.setInputFiles(filePath);
        return true;
      }
    } catch (e) { console.warn('[Lever] Resume upload failed:', e.message); }
    return false;
  },

  getSubmitSelector() {
    return 'button[type="submit"], .postings-btn-submit, [data-qa="btn-submit"]';
  },

  async validate(page) {
    const issues = [];
    return { valid: true, issues };
  }
};

// ═════════════════════════════════════════════════════════════════════
// WELLFOUND ADAPTER
// ═════════════════════════════════════════════════════════════════════
const WellfoundAdapter = {
  name: 'wellfound',

  detect(url) {
    const u = (url || '').toLowerCase();
    return u.includes('wellfound.com') || u.includes('angel.co');
  },

  async scanFields(page) {
    return page.evaluate(() => {
      const fields = [];
      document.querySelectorAll('input:not([type="hidden"]), textarea, select').forEach(input => {
        const label = document.querySelector(`label[for="${input.id}"]`) || input.closest('label');
        fields.push({
          selector: input.id ? `#${input.id}` : `[name="${input.name}"]`,
          id: input.id || '',
          name: input.name || '',
          type: input.type || input.tagName.toLowerCase(),
          label: (label?.textContent || input.placeholder || input.getAttribute('aria-label') || input.name || '').replace(/\s*\*$/, '').trim(),
          placeholder: input.placeholder || '',
          required: input.required
        });
      });
      return fields;
    });
  },

  async fillField(page, selector, value) {
    return humanType(page, selector, value);
  },

  async uploadResume(page, filePath) {
    try {
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        await fileInput.setInputFiles(filePath);
        return true;
      }
    } catch (e) { console.warn('[Wellfound] Resume upload failed:', e.message); }
    return false;
  },

  getSubmitSelector() {
    return 'button[type="submit"], [data-test="apply-button"]';
  },

  async validate(page) {
    return { valid: true, issues: [] };
  }
};

// ═════════════════════════════════════════════════════════════════════
// YC JOBS ADAPTER
// ═════════════════════════════════════════════════════════════════════
const YCJobsAdapter = {
  name: 'ycjobs',

  detect(url) {
    const u = (url || '').toLowerCase();
    return u.includes('ycombinator.com') || u.includes('workatastartup.com');
  },

  async scanFields(page) {
    return page.evaluate(() => {
      const fields = [];
      document.querySelectorAll('input:not([type="hidden"]), textarea, select').forEach(input => {
        const label = document.querySelector(`label[for="${input.id}"]`) || input.closest('label');
        fields.push({
          selector: input.id ? `#${input.id}` : `[name="${input.name}"]`,
          id: input.id || '',
          name: input.name || '',
          type: input.type || input.tagName.toLowerCase(),
          label: (label?.textContent || input.placeholder || input.name || '').replace(/\s*\*$/, '').trim(),
          placeholder: input.placeholder || '',
          required: input.required
        });
      });
      return fields;
    });
  },

  async fillField(page, selector, value) {
    return humanType(page, selector, value);
  },

  async uploadResume(page, filePath) {
    try {
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        await fileInput.setInputFiles(filePath);
        return true;
      }
    } catch (e) { console.warn('[YCJobs] Resume upload failed:', e.message); }
    return false;
  },

  getSubmitSelector() {
    return 'button[type="submit"]';
  },

  async validate(page) {
    return { valid: true, issues: [] };
  }
};

// ═════════════════════════════════════════════════════════════════════
// GENERIC ADAPTER (fallback)
// ═════════════════════════════════════════════════════════════════════
const GenericAdapter = {
  name: 'generic',

  detect() {
    return true; // Always matches as fallback
  },

  async scanFields(page) {
    return page.evaluate(() => {
      const fields = [];
      document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select').forEach(input => {
        let labelText = '';
        if (input.id) {
          const lbl = document.querySelector(`label[for="${input.id}"]`);
          if (lbl) labelText = lbl.textContent.trim();
        }
        if (!labelText) {
          const parent = input.closest('label, .form-group, .field, [class*="field"]');
          if (parent) {
            const lbl = parent.querySelector('label, .label, [class*="label"]');
            if (lbl) labelText = lbl.textContent.trim();
          }
        }
        if (!labelText) labelText = input.placeholder || input.getAttribute('aria-label') || input.name || input.id || '';
        labelText = labelText.replace(/\s*\*$/, '').trim();

        if (input.name || input.id || labelText) {
          fields.push({
            selector: input.id ? `#${CSS.escape(input.id)}` : (input.name ? `[name="${CSS.escape(input.name)}"]` : ''),
            id: input.id || '',
            name: input.name || '',
            type: input.type || input.tagName.toLowerCase(),
            label: labelText,
            placeholder: input.placeholder || '',
            required: input.required || input.hasAttribute('required')
          });
        }
      });
      return fields.filter(f => f.selector);
    });
  },

  async fillField(page, selector, value) {
    return humanType(page, selector, value);
  },

  async uploadResume(page, filePath) {
    try {
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        await fileInput.setInputFiles(filePath);
        return true;
      }
    } catch (e) { console.warn('[Generic] Resume upload failed:', e.message); }
    return false;
  },

  getSubmitSelector() {
    return 'button[type="submit"], input[type="submit"], [class*="submit"]';
  },

  async validate(page) {
    return { valid: true, issues: [] };
  }
};

// ─── Adapter Registry ───────────────────────────────────────────────
const ADAPTERS = [GreenhouseAdapter, LeverAdapter, WellfoundAdapter, YCJobsAdapter, GenericAdapter];

/**
 * Detect which platform a URL belongs to and return the appropriate adapter.
 */
export function getAdapter(url) {
  for (const adapter of ADAPTERS) {
    if (adapter !== GenericAdapter && adapter.detect(url)) {
      return adapter;
    }
  }
  return GenericAdapter;
}

export { GreenhouseAdapter, LeverAdapter, WellfoundAdapter, YCJobsAdapter, GenericAdapter };
