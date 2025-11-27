import type { DialogPattern } from './types'
import { getFocusableElements, findByAttribute } from '../../common/dom'
import { getRole } from '../../common/aria'

/**
 * Detects dialog patterns in the document
 */
export class DialogDetector {
  constructor(private document: Document) {}

  /**
   * Detect all dialog patterns
   */
  detectAll(): DialogPattern[] {
    const patterns: DialogPattern[] = []

    // Level 1: Explicit ARIA roles
    patterns.push(...this.detectExplicitDialogs())

    // Level 2: Native <dialog> elements
    patterns.push(...this.detectNativeDialogs())

    // Level 3: Heuristic detection (future)
    // patterns.push(...this.detectHeuristicDialogs())

    return patterns
  }

  /**
   * Detect dialogs with explicit role="dialog" or role="alertdialog"
   */
  private detectExplicitDialogs(): DialogPattern[] {
    const selectors = '[role="dialog"], [role="alertdialog"]'
    const elements = this.document.querySelectorAll(selectors)

    return Array.from(elements).map(element => 
      this.createDialogPattern(element, 'explicit-role', 'high')
    )
  }

  /**
   * Detect native <dialog> elements
   */
  private detectNativeDialogs(): DialogPattern[] {
    const elements = this.document.querySelectorAll('dialog')

    return Array.from(elements).map(element =>
      this.createDialogPattern(element, 'native-element', 'high')
    )
  }

  /**
   * Create a dialog pattern object
   */
  private createDialogPattern(
    element: Element,
    detectionMethod: DialogPattern['detectionMethod'],
    confidence: DialogPattern['confidence']
  ): DialogPattern {
    const role = getRole(element)
    const isAlertDialog = role === 'alertdialog'
    const isModal = element.getAttribute('aria-modal') === 'true'

    return {
      type: 'dialog',
      confidence,
      detectionMethod,
      element,
      relatedElements: {
        triggers: this.findTriggers(element),
        closeButtons: this.findCloseButtons(element),
        backdrop: this.findBackdrop(element),
        focusableElements: getFocusableElements(element),
      },
      metadata: {
        isModal,
        hasBackdrop: !!this.findBackdrop(element),
        isAlertDialog,
      },
      issues: [], // Populated by validator
    }
  }

  /**
   * Find trigger buttons for dialog
   */
  private findTriggers(dialog: Element): Element[] {
    if (!dialog.id) return []

    const triggers: Element[] = []

    // aria-controls
    triggers.push(...findByAttribute(this.document, 'aria-controls', dialog.id))

    // data-target (common pattern)
    triggers.push(
      ...Array.from(this.document.querySelectorAll(
        `[data-target="#${dialog.id}"], [data-target="${dialog.id}"]`
      ))
    )

    // Deduplicate
    return Array.from(new Set(triggers))
  }

  /**
   * Find close buttons within dialog
   */
  private findCloseButtons(dialog: Element): Element[] {
    const buttons: Element[] = []
    const candidates = Array.from(dialog.querySelectorAll('button, [role="button"]'))

    for (const button of candidates) {
      const text = button.textContent?.toLowerCase() || ''
      const label = button.getAttribute('aria-label')?.toLowerCase() || ''
      const className = button.className.toLowerCase()

      if (
        text.includes('close') ||
        text.includes('dismiss') ||
        text.includes('cancel') ||
        label.includes('close') ||
        label.includes('dismiss') ||
        className.includes('close') ||
        button.hasAttribute('data-dismiss') ||
        button.hasAttribute('data-close')
      ) {
        buttons.push(button)
      }
    }

    return buttons
  }

  /**
   * Find backdrop/overlay element
   */
  private findBackdrop(dialog: Element): Element | null {
    const parent = dialog.parentElement
    if (!parent) return null

    // Check siblings
    for (const sibling of Array.from(parent.children)) {
      if (sibling === dialog) continue

      const className = sibling.className.toLowerCase()
      if (
        className.includes('backdrop') ||
        className.includes('overlay') ||
        className.includes('mask')
      ) {
        return sibling
      }
    }

    return null
  }
}