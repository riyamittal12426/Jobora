/**
 * Screenshot Service
 * Captures and compresses page screenshots for the automation preview flow.
 */

/**
 * Capture a full-page screenshot as a base64 JPEG string.
 * Compressed to stay under ~500KB for MongoDB storage.
 */
export async function captureScreenshot(page, options = {}) {
  try {
    const buffer = await page.screenshot({
      fullPage: options.fullPage ?? false,
      type: 'jpeg',
      quality: options.quality ?? 60,
      timeout: 8000
    });
    return buffer.toString('base64');
  } catch (err) {
    console.error('[Screenshot] Failed to capture:', err.message);
    return null;
  }
}

/**
 * Capture a screenshot of just the visible viewport area.
 */
export async function captureViewport(page) {
  return captureScreenshot(page, { fullPage: false, quality: 70 });
}

/**
 * Capture full-page screenshot (for pre-submission review).
 */
export async function captureFullPage(page) {
  return captureScreenshot(page, { fullPage: true, quality: 55 });
}

/**
 * Inject CSS to visually highlight filled fields on the page
 * for the user's pre-submission review screenshot.
 */
export async function highlightFilledFields(page, fieldSelectors) {
  try {
    await page.evaluate((selectors) => {
      selectors.forEach(sel => {
        const el = document.querySelector(sel);
        if (el) {
          el.style.outline = '3px solid #8b5cf6';
          el.style.outlineOffset = '2px';
          el.style.backgroundColor = 'rgba(139, 92, 246, 0.08)';
        }
      });
    }, fieldSelectors);
  } catch (err) {
    console.warn('[Screenshot] Failed to highlight fields:', err.message);
  }
}
