/**
 * DOM utility functions
 * Standalone implementation without axe-core
 */

/**
 * Check if element is visible
 * Note: This is simplified - full visibility checking requires computed styles
 */
export function isVisible(element: Element): boolean {
  const htmlElement = element as HTMLElement

  // Check hidden attribute
  if (element.hasAttribute('hidden')) {
    return false
  }

  // Check aria-hidden (note: aria-hidden doesn't affect visibility, only a11y tree)
  // But for our purposes, we'll consider it hidden
  if (element.getAttribute('aria-hidden') === 'true') {
    return false
  }

  // Check inline styles
  const style = htmlElement.style
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false
  }

  // Check common hidden classes
  const hiddenClasses = ['hidden', 'hide', 'd-none', 'invisible', 'sr-only', 'visually-hidden']
  if (hiddenClasses.some(cls => element.classList.contains(cls))) {
    return false
  }

  // Note: offsetWidth/Height are 0 in JSDOM, so we can't rely on them
  // In a real browser, you would check:
  // if (htmlElement.offsetWidth === 0 && htmlElement.offsetHeight === 0) {
  //   return false
  // }

  return true
}

/**
 * Check if element is explicitly hidden
 * Inverse of isVisible for backward compatibility
 */
export function isExplicitlyHidden(element: Element): boolean {
  return !isVisible(element)
}

/**
 * Get all focusable elements within container
 */
export function getFocusableElements(container: Element): Element[] {
  // Get all potential focusable elements
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
    'audio[controls]',
    'video[controls]',
    'details',
  ].join(',')

  // Note: We don't filter by visibility here because this is often used
  // for hidden dialogs/menus that will become visible
  return Array.from(container.querySelectorAll(selector))
}

/**
 * Find elements by attribute value
 */
export function findByAttribute(
  root: Document | Element,
  attribute: string,
  value: string
): Element[] {
  // Manually escape value for selector (CSS.escape not available in JSDOM)
  const escapedValue = value.replace(/"/g, '\\"')
  return Array.from(root.querySelectorAll(`[${attribute}="${escapedValue}"]`))
}

/**
 * Get simple string representation of element
 */
export function getElementSelector(element: Element): string {
  const parts: string[] = [element.tagName.toLowerCase()]

  if (element.id) {
    parts.push(`#${element.id}`)
  } else if (element.className) {
    const firstClass = Array.from(element.classList)[0]
    if (firstClass) {
      parts.push(`.${firstClass}`)
    }
  }

  const role = element.getAttribute('role')
  if (role) {
    parts.push(`[role="${role}"]`)
  }

  return parts.join('')
}

/**
 * Find label for form element
 */
export function findLabel(element: Element): Element | null {
  const { getLabel } = require('./aria')
  return getLabel(element)
}

/**
 * Check if element is in the DOM
 */
export function isConnected(element: Element): boolean {
  return element.isConnected
}

/**
 * Get the closest ancestor that matches a selector
 * (Polyfill for older environments)
 */
export function closest(element: Element, selector: string): Element | null {
  return element.closest(selector)
}

/**
 * Check if element matches a selector
 */
export function matches(element: Element, selector: string): boolean {
  return element.matches(selector)
}

/**
 * Find common ancestor of two elements
 */
export function findCommonAncestor(el1: Element, el2: Element): Element | null {
  const parents1: Element[] = []
  let current: Element | null = el1

  // Collect all ancestors of el1
  while (current) {
    parents1.push(current)
    current = current.parentElement
  }

  // Walk up el2's ancestors until we find one in el1's ancestor list
  current = el2
  while (current) {
    if (parents1.includes(current)) {
      return current
    }
    current = current.parentElement
  }

  return null
}

/**
 * Get all ancestors of an element
 */
export function getAncestors(element: Element): Element[] {
  const ancestors: Element[] = []
  let current = element.parentElement

  while (current) {
    ancestors.push(current)
    current = current.parentElement
  }

  return ancestors
}

/**
 * Check if element is offscreen
 * (Simplified - requires layout information)
 */
export function isOffscreen(element: Element): boolean {
  const htmlElement = element as HTMLElement

  // Check inline styles for negative positioning
  const style = htmlElement.style
  
  // Common offscreen techniques
  if (style.position === 'absolute' || style.position === 'fixed') {
    const left = parseInt(style.left || '0')
    const top = parseInt(style.top || '0')
    
    if (left < -1000 || top < -1000) {
      return true
    }
  }

  // Check for clip/clip-path
  if (style.clip === 'rect(0,0,0,0)' || style.clipPath === 'inset(50%)') {
    return true
  }

  return false
}

/**
 * Query selector with error handling
 */
export function querySelector(
  root: Document | Element,
  selector: string
): Element | null {
  try {
    return root.querySelector(selector)
  } catch (error) {
    console.error(`Invalid selector: ${selector}`, error)
    return null
  }
}

/**
 * Query selector all with error handling
 */
export function querySelectorAll(
  root: Document | Element,
  selector: string
): Element[] {
  try {
    return Array.from(root.querySelectorAll(selector))
  } catch (error) {
    console.error(`Invalid selector: ${selector}`, error)
    return []
  }
}