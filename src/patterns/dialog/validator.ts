import type { DialogPattern, DialogRule } from './types'
import type { Issue } from '../../core/types'
import { hasAccessibleName } from '../../common/aria'
import { isExplicitlyHidden } from '../../common/dom'

/**
 * APG Dialog Pattern Rules
 * Based on: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */
const DIALOG_RULES: DialogRule[] = [
  {
    id: 'dialog-accessible-name',
    description: 'Dialog must have an accessible name',
    severity: 'error',
    test: (pattern) => hasAccessibleName(pattern.element),
    message: 'Dialog must have an accessible name',
    suggestion: 'Add aria-label or aria-labelledby attribute to the dialog',
  },
  {
    id: 'dialog-close-button',
    description: 'Dialog should contain a close button',
    severity: 'error',
    test: (pattern) => pattern.relatedElements.closeButtons.length > 0,
    message: 'Dialog should contain a close button',
    suggestion: 'Add a button with aria-label="Close" or visible close text',
  },
  {
    id: 'dialog-initially-hidden',
    description: 'Dialog should be hidden initially',
    severity: 'warning',
    test: (pattern) => isExplicitlyHidden(pattern.element),
    message: 'Dialog should be hidden initially',
    suggestion: 'Add hidden attribute or CSS display: none',
  },
  {
    id: 'dialog-focusable-content',
    description: 'Dialog must contain focusable elements',
    severity: 'error',
    test: (pattern) => pattern.relatedElements.focusableElements.length > 0,
    message: 'Dialog contains no focusable elements',
    suggestion: 'Add at least one button, link, or input element',
  },
  {
    id: 'dialog-aria-modal',
    description: 'Modal dialogs should have aria-modal="true"',
    severity: 'warning',
    test: (pattern) => {
      // Only check if it looks like a modal (has backdrop)
      if (!pattern.metadata.hasBackdrop) return true
      return pattern.metadata.isModal
    },
    message: 'Dialog appears to be modal but missing aria-modal="true"',
    suggestion: 'Add aria-modal="true" if this dialog is modal',
  },
  {
    id: 'dialog-close-button-label',
    description: 'Close buttons must have accessible names',
    severity: 'error',
    test: (pattern) => {
      return pattern.relatedElements.closeButtons.every(btn => 
        hasAccessibleName(btn)
      )
    },
    message: 'Close button must have an accessible name',
    suggestion: 'Add aria-label="Close" or visible text to close button',
  },
]

/**
 * Validates dialog patterns against APG rules
 */
export class DialogValidator {
  /**
   * Validate a dialog pattern
   */
  validate(pattern: DialogPattern): Issue[] {
    const issues: Issue[] = []

    for (const rule of DIALOG_RULES) {
      const passed = rule.test(pattern)
      
      if (!passed) {
        issues.push({
          severity: rule.severity,
          message: rule.message,
          suggestion: rule.suggestion,
          ruleId: rule.id,
          element: pattern.element,
        })
      }
    }

    return issues
  }
}