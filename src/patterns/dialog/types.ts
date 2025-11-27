import type { Pattern } from '../../core/types'

/**
 * Dialog-specific pattern with related elements
 */
export interface DialogPattern extends Pattern {
  type: 'dialog'
  relatedElements: {
    /** Buttons that trigger this dialog */
    triggers: Element[]
    /** Close buttons within the dialog */
    closeButtons: Element[]
    /** Backdrop/overlay element */
    backdrop: Element | null
    /** All focusable elements */
    focusableElements: Element[]
  }
  metadata: {
    /** Whether this is a modal dialog */
    isModal: boolean
    /** Whether dialog has a backdrop */
    hasBackdrop: boolean
    /** Whether this is an alert dialog */
    isAlertDialog: boolean
  }
}

/**
 * Dialog validation rule
 */
export interface DialogRule {
  /** Unique rule ID */
  id: string
  /** Human-readable description */
  description: string
  /** Severity if rule fails */
  severity: 'error' | 'warning' | 'info'
  /** Test function */
  test: (pattern: DialogPattern) => boolean
  /** Message when rule fails */
  message: string
  /** Optional suggestion for fixing */
  suggestion?: string
}