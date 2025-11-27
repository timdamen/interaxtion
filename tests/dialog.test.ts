import { describe, it, expect, beforeEach } from 'vitest'
import { Analyzer } from '../src/core/analyzer'
import type { RunnerConfig } from '../src/core/types'

/**
 * Helper to analyze HTML in browser mode
 */
function analyzeHTML(html: string, config?: RunnerConfig) {
  // Create a container element
  const container = document.createElement('div')
  container.innerHTML = html
  document.body.appendChild(container)

  // Run the analyzer on the document
  const analyzer = new Analyzer(document, config?.analyzerConfig)
  const result = analyzer.analyze()

  // Cleanup
  document.body.removeChild(container)

  return Promise.resolve(result)
}

beforeEach(() => {
  // Clear the document body before each test
  document.body.innerHTML = ''
})

describe('Dialog Pattern Detection', () => {
  describe('Detection', () => {
    it('should detect dialog with explicit role', async () => {
      const html = `
        <div role="dialog" aria-label="Test Dialog" hidden>
          <button>Close</button>
        </div>
      `

      const result = await analyzeHTML(html)

      expect(result.summary.patternsFound).toBe(1)
      expect(result.patterns[0].type).toBe('dialog')
      expect(result.patterns[0].confidence).toBe('high')
      expect(result.patterns[0].detectionMethod).toBe('explicit-role')
    })

    it('should detect native dialog element', async () => {
      const html = `<dialog>Content</dialog>`

      const result = await analyzeHTML(html)

      expect(result.summary.patternsFound).toBe(1)
      expect(result.patterns[0].detectionMethod).toBe('native-element')
    })

    it('should detect alertdialog', async () => {
      const html = `
        <div role="alertdialog" aria-label="Warning" hidden>
          <p>Warning message</p>
          <button>OK</button>
        </div>
      `

      const result = await analyzeHTML(html)

      expect(result.summary.patternsFound).toBe(1)
      expect(result.patterns[0].type).toBe('dialog')
    })

    it('should detect multiple dialogs', async () => {
      const html = `
        <div role="dialog" aria-label="Dialog 1" hidden>
          <button>Close</button>
        </div>
        <div role="dialog" aria-label="Dialog 2" hidden>
          <button>Close</button>
        </div>
      `

      const result = await analyzeHTML(html)

      expect(result.summary.patternsFound).toBe(2)
    })
  })

  describe('Validation - Accessible Name', () => {
    it('should pass when dialog has aria-label', async () => {
      const html = `
        <div role="dialog" aria-label="Confirm Action" hidden>
          <button aria-label="Close">X</button>
        </div>
      `

      const result = await analyzeHTML(html)
      const dialog = result.patterns[0]
      const accessibleNameIssues = dialog.issues.filter(
        i => i.ruleId === 'dialog-accessible-name'
      )

      expect(accessibleNameIssues).toHaveLength(0)
    })

    it('should pass when dialog has aria-labelledby', async () => {
      const html = `
        <div role="dialog" aria-labelledby="dialog-title" hidden>
          <h2 id="dialog-title">Delete Item</h2>
          <button aria-label="Close">X</button>
        </div>
      `

      const result = await analyzeHTML(html)
      const dialog = result.patterns[0]
      const accessibleNameIssues = dialog.issues.filter(
        i => i.ruleId === 'dialog-accessible-name'
      )

      expect(accessibleNameIssues).toHaveLength(0)
    })

    it('should fail when dialog has no accessible name', async () => {
      const html = `
        <div role="dialog" hidden>
          <p>Content</p>
        </div>
      `

      const result = await analyzeHTML(html)
      const dialog = result.patterns[0]
      const accessibleNameIssues = dialog.issues.filter(
        i => i.ruleId === 'dialog-accessible-name'
      )

      expect(accessibleNameIssues).toHaveLength(1)
      expect(accessibleNameIssues[0].severity).toBe('error')
      expect(accessibleNameIssues[0].message).toContain('accessible name')
    })
  })

  describe('Validation - Close Button', () => {
    it('should pass when dialog has close button', async () => {
      const html = `
        <div role="dialog" aria-label="Test" hidden>
          <button aria-label="Close">X</button>
        </div>
      `

      const result = await analyzeHTML(html)
      const dialog = result.patterns[0]
      const closeButtonIssues = dialog.issues.filter(
        i => i.ruleId === 'dialog-close-button'
      )

      expect(closeButtonIssues).toHaveLength(0)
    })

    it('should detect close button by aria-label', async () => {
      const html = `
        <div role="dialog" aria-label="Test" hidden>
          <button aria-label="Close dialog">×</button>
        </div>
      `

      const result = await analyzeHTML(html)
      const dialog = result.patterns[0] as any

      expect(dialog.relatedElements.closeButtons).toHaveLength(1)
    })

    it('should detect close button by text content', async () => {
      const html = `
        <div role="dialog" aria-label="Test" hidden>
          <button>Close</button>
        </div>
      `

      const result = await analyzeHTML(html)
      const dialog = result.patterns[0] as any

      expect(dialog.relatedElements.closeButtons).toHaveLength(1)
    })

    it('should detect close button by class name', async () => {
      const html = `
        <div role="dialog" aria-label="Test" hidden>
          <button class="modal-close" aria-label="Close">X</button>
        </div>
      `

      const result = await analyzeHTML(html)
      const dialog = result.patterns[0] as any

      expect(dialog.relatedElements.closeButtons).toHaveLength(1)
    })

    it('should fail when dialog has no close button', async () => {
      const html = `
        <div role="dialog" aria-label="Test" hidden>
          <p>Content only</p>
        </div>
      `

      const result = await analyzeHTML(html)
      const dialog = result.patterns[0]
      const closeButtonIssues = dialog.issues.filter(
        i => i.ruleId === 'dialog-close-button'
      )

      expect(closeButtonIssues).toHaveLength(1)
      expect(closeButtonIssues[0].severity).toBe('error')
    })

    it('should fail when close button has no accessible name', async () => {
      const html = `
        <div role="dialog" aria-label="Test" hidden>
          <button class="close"></button>
        </div>
      `

      const result = await analyzeHTML(html)
      const dialog = result.patterns[0]
      const labelIssues = dialog.issues.filter(
        i => i.ruleId === 'dialog-close-button-label'
      )

      expect(labelIssues).toHaveLength(1)
      expect(labelIssues[0].severity).toBe('error')
    })
  })

  describe('Validation - Initially Hidden', () => {
    it('should pass when dialog has hidden attribute', async () => {
      const html = `
        <div role="dialog" aria-label="Test" hidden>
          <button aria-label="Close">X</button>
        </div>
      `

      const result = await analyzeHTML(html)
      const dialog = result.patterns[0]
      const hiddenIssues = dialog.issues.filter(
        i => i.ruleId === 'dialog-initially-hidden'
      )

      expect(hiddenIssues).toHaveLength(0)
    })

    it('should pass when dialog has display: none', async () => {
      const html = `
        <div role="dialog" aria-label="Test" style="display: none">
          <button aria-label="Close">X</button>
        </div>
      `

      const result = await analyzeHTML(html)
      const dialog = result.patterns[0]
      const hiddenIssues = dialog.issues.filter(
        i => i.ruleId === 'dialog-initially-hidden'
      )

      expect(hiddenIssues).toHaveLength(0)
    })

    it('should warn when dialog is not hidden', async () => {
      const html = `
        <div role="dialog" aria-label="Test">
          <button aria-label="Close">X</button>
        </div>
      `

      const result = await analyzeHTML(html)
      const dialog = result.patterns[0]
      const hiddenIssues = dialog.issues.filter(
        i => i.ruleId === 'dialog-initially-hidden'
      )

      expect(hiddenIssues).toHaveLength(1)
      expect(hiddenIssues[0].severity).toBe('warning')
    })
  })

  describe('Validation - Focusable Content', () => {
    it('should pass when dialog has focusable elements', async () => {
      const html = `
        <div role="dialog" aria-label="Test" hidden>
          <button>Cancel</button>
          <button>OK</button>
        </div>
      `

      const result = await analyzeHTML(html)
      const dialog = result.patterns[0]
      const focusableIssues = dialog.issues.filter(
        i => i.ruleId === 'dialog-focusable-content'
      )

      expect(focusableIssues).toHaveLength(0)
    })

    it('should fail when dialog has no focusable elements', async () => {
      const html = `
        <div role="dialog" aria-label="Test" hidden>
          <p>Just text</p>
        </div>
      `

      const result = await analyzeHTML(html)
      const dialog = result.patterns[0]
      const focusableIssues = dialog.issues.filter(
        i => i.ruleId === 'dialog-focusable-content'
      )

      expect(focusableIssues).toHaveLength(1)
      expect(focusableIssues[0].severity).toBe('error')
    })
  })

  describe('Validation - aria-modal', () => {
    it('should pass when modal dialog has aria-modal="true"', async () => {
      const html = `
        <div class="backdrop"></div>
        <div role="dialog" aria-label="Test" aria-modal="true" hidden>
          <button aria-label="Close">X</button>
        </div>
      `

      const result = await analyzeHTML(html)
      const dialog = result.patterns[0]
      const modalIssues = dialog.issues.filter(
        i => i.ruleId === 'dialog-aria-modal'
      )

      expect(modalIssues).toHaveLength(0)
    })

    it('should warn when modal dialog missing aria-modal', async () => {
      const html = `
        <div class="backdrop"></div>
        <div role="dialog" aria-label="Test" hidden>
          <button aria-label="Close">X</button>
        </div>
      `

      const result = await analyzeHTML(html)
      const dialog = result.patterns[0]
      const modalIssues = dialog.issues.filter(
        i => i.ruleId === 'dialog-aria-modal'
      )

      expect(modalIssues).toHaveLength(1)
      expect(modalIssues[0].severity).toBe('warning')
    })
  })

  describe('Related Elements - Triggers', () => {
    it('should find trigger by aria-controls', async () => {
      const html = `
        <button aria-controls="my-dialog">Open</button>
        <div id="my-dialog" role="dialog" aria-label="Test" hidden>
          <button aria-label="Close">X</button>
        </div>
      `

      const result = await analyzeHTML(html)
      const dialog = result.patterns[0] as any

      expect(dialog.relatedElements.triggers).toHaveLength(1)
    })

    it('should find trigger by data-target', async () => {
      const html = `
        <button data-target="#my-dialog">Open</button>
        <div id="my-dialog" role="dialog" aria-label="Test" hidden>
          <button aria-label="Close">X</button>
        </div>
      `

      const result = await analyzeHTML(html)
      const dialog = result.patterns[0] as any

      expect(dialog.relatedElements.triggers).toHaveLength(1)
    })

    it('should find multiple triggers', async () => {
      const html = `
        <button aria-controls="my-dialog">Open 1</button>
        <button data-target="#my-dialog">Open 2</button>
        <div id="my-dialog" role="dialog" aria-label="Test" hidden>
          <button aria-label="Close">X</button>
        </div>
      `

      const result = await analyzeHTML(html)
      const dialog = result.patterns[0] as any

      expect(dialog.relatedElements.triggers).toHaveLength(2)
    })
  })

  describe('Configuration', () => {
    it('should respect minConfidence filter', async () => {
      const html = `
        <div role="dialog" aria-label="Test" hidden>
          <button aria-label="Close">X</button>
        </div>
      `

      const result = await analyzeHTML(html, {
        analyzerConfig: {
          minConfidence: 'high',
        },
      })

      expect(result.summary.patternsFound).toBe(1)
    })

    it('should exclude suggestions when configured', async () => {
      const html = `
        <div role="dialog" hidden>
          <button aria-label="Close">X</button>
        </div>
      `

      const result = await analyzeHTML(html, {
        analyzerConfig: {
          includeSuggestions: false,
        },
      })

      const dialog = result.patterns[0]
      dialog.issues.forEach(issue => {
        expect(issue.suggestion).toBeUndefined()
      })
    })

    it('should filter by pattern type', async () => {
      const html = `
        <div role="dialog" aria-label="Test" hidden>
          <button aria-label="Close">X</button>
        </div>
      `

      const result = await analyzeHTML(html, {
        analyzerConfig: {
          patterns: ['dialog'],
        },
      })

      expect(result.summary.patternsFound).toBe(1)
    })
  })

  describe('Summary Statistics', () => {
    it('should count errors correctly', async () => {
      const html = `
        <div role="dialog" hidden>
          <p>No buttons, no label</p>
        </div>
      `

      const result = await analyzeHTML(html)

      expect(result.summary.errors).toBeGreaterThan(0)
    })

    it('should count warnings correctly', async () => {
      const html = `
        <div role="dialog" aria-label="Test">
          <button aria-label="Close">X</button>
        </div>
      `

      const result = await analyzeHTML(html)

      expect(result.summary.warnings).toBeGreaterThan(0)
    })
  })

  describe('Perfect Dialog', () => {
    it('should have no issues for a well-formed dialog', async () => {
      const html = `
        <button aria-controls="confirm-dialog">Delete Item</button>
        <div id="confirm-dialog" 
             role="dialog" 
             aria-labelledby="dialog-title"
             aria-modal="true"
             hidden>
          <h2 id="dialog-title">Confirm Deletion</h2>
          <p>Are you sure you want to delete this item?</p>
          <button>Cancel</button>
          <button>Delete</button>
          <button aria-label="Close dialog">×</button>
        </div>
      `

      const result = await analyzeHTML(html)

      expect(result.summary.patternsFound).toBe(1)
      expect(result.summary.errors).toBe(0)
      expect(result.patterns[0].issues).toHaveLength(0)
    })
  })
})