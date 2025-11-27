/**
 * Bundle injection utilities for different E2E drivers
 */

import type { E2EPage, SupportedDriver } from './driver-detect'
import { getBrowserBundlePath, getBrowserBundleContent } from './driver-detect'

/**
 * Inject the interaxtion browser bundle into a page
 *
 * This handles the differences between various E2E drivers:
 * - Playwright: Uses addScriptTag with path
 * - Puppeteer: Uses addScriptTag with path
 * - WebDriverIO: Uses execute with inline content
 * - Unknown: Tries path-based injection as fallback
 *
 * @param page - The E2E page object
 * @param driver - The detected driver type
 */
export async function injectBundle(page: E2EPage, driver: SupportedDriver): Promise<void> {
  switch (driver) {
    case 'playwright':
    case 'puppeteer': {
      // Both Playwright and Puppeteer support addScriptTag with path
      if (!page.addScriptTag) {
        throw new Error('Page does not support addScriptTag method')
      }

      const bundlePath = await getBrowserBundlePath()
      await page.addScriptTag({ path: bundlePath })
      break
    }

    case 'webdriverio': {
      // WebDriverIO needs inline content via execute
      const content = await getBrowserBundleContent()

      // WebDriverIO's execute method
      const wdioPage = page as unknown as { execute: (script: string) => Promise<void> }

      if (typeof wdioPage.execute !== 'function') {
        throw new Error('Page does not support execute method')
      }

      await wdioPage.execute(content)
      break
    }

    case 'unknown':
    default: {
      // Try path-based injection as fallback
      if (page.addScriptTag) {
        const bundlePath = await getBrowserBundlePath()
        await page.addScriptTag({ path: bundlePath })
      } else {
        // Last resort: try inline content
        const content = await getBrowserBundleContent()
        await page.evaluate(content)
      }
      break
    }
  }
}

/**
 * Check if the interaxtion bundle is already loaded in the page
 *
 * @param page - The E2E page object
 * @returns true if the bundle is loaded, false otherwise
 */
export async function isBundleLoaded(page: E2EPage): Promise<boolean> {
  return page.evaluate(() => {
    return typeof (window as unknown as { interaxtion?: unknown }).interaxtion !== 'undefined'
  })
}
