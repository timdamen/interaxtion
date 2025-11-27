/**
 * ARIA utility functions
 * Standalone implementation without axe-core
 */

/**
 * Get accessible name for element
 * Simplified implementation of the accessible name computation
 * Based on: https://www.w3.org/TR/accname-1.2/
 */
export function getAccessibleName(element: Element): string {
  // Step 1: aria-labelledby (highest priority)
  const labelledBy = element.getAttribute('aria-labelledby')
  if (labelledBy) {
    const ids = labelledBy.trim().split(/\s+/)
    const texts = ids
      .map(id => {
        const referencedElement = element.ownerDocument?.getElementById(id)
        return referencedElement?.textContent?.trim() || ''
      })
      .filter(Boolean)
    
    if (texts.length > 0) {
      return texts.join(' ')
    }
  }

  // Step 2: aria-label
  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel?.trim()) {
    return ariaLabel.trim()
  }

  // Step 3: Native labeling (for form elements)
  const tagName = element.tagName.toLowerCase()
  if (['input', 'textarea', 'select'].includes(tagName)) {
    // Check for <label> element
    const label = findLabelElement(element)
    if (label?.textContent?.trim()) {
      return label.textContent.trim()
    }
  }

  // Step 4: Alt attribute (for images)
  if (tagName === 'img') {
    const alt = element.getAttribute('alt')
    if (alt !== null) {
      return alt.trim()
    }
  }

  // Step 5: Title attribute
  const title = element.getAttribute('title')
  if (title?.trim()) {
    return title.trim()
  }

  // Step 6: Text content (for buttons, links, etc.)
  if (['button', 'a'].includes(tagName)) {
    const text = element.textContent?.trim()
    if (text) {
      return text
    }
  }

  // Step 7: Placeholder (last resort for inputs)
  if (['input', 'textarea'].includes(tagName)) {
    const placeholder = element.getAttribute('placeholder')
    if (placeholder?.trim()) {
      return placeholder.trim()
    }
  }

  return ''
}

/**
 * Check if element has accessible name
 */
export function hasAccessibleName(element: Element): boolean {
  return getAccessibleName(element).length > 0
}

/**
 * Get role of element (explicit or implicit)
 */
export function getRole(element: Element): string | null {
  // Step 1: Explicit role attribute
  const explicitRole = element.getAttribute('role')
  if (explicitRole) {
    // First token wins if multiple roles specified
    return explicitRole.trim().split(/\s+/)[0]
  }

  // Step 2: Implicit role based on HTML semantics
  const tagName = element.tagName.toLowerCase()
  
  // Simple implicit role mapping
  const implicitRoles: Record<string, string | ((el: Element) => string | null)> = {
    'a': (el) => el.hasAttribute('href') ? 'link' : null,
    'article': 'article',
    'aside': 'complementary',
    'button': 'button',
    'dialog': 'dialog',
    'footer': 'contentinfo',
    'form': 'form',
    'h1': 'heading',
    'h2': 'heading',
    'h3': 'heading',
    'h4': 'heading',
    'h5': 'heading',
    'h6': 'heading',
    'header': 'banner',
    'img': (el) => {
      const alt = el.getAttribute('alt')
      // Empty alt means presentational
      return alt === '' ? 'presentation' : 'img'
    },
    'input': (el) => {
      const type = (el as HTMLInputElement).type?.toLowerCase() || 'text'
      const typeRoles: Record<string, string> = {
        'button': 'button',
        'checkbox': 'checkbox',
        'email': 'textbox',
        'number': 'spinbutton',
        'radio': 'radio',
        'range': 'slider',
        'reset': 'button',
        'search': 'searchbox',
        'submit': 'button',
        'tel': 'textbox',
        'text': 'textbox',
        'url': 'textbox',
      }
      return typeRoles[type] || 'textbox'
    },
    'li': 'listitem',
    'main': 'main',
    'nav': 'navigation',
    'ol': 'list',
    'section': (el) => {
      // section has role=region only if it has an accessible name
      return hasAccessibleName(el) ? 'region' : null
    },
    'select': (el) => {
      // Multiple select has different role
      return (el as HTMLSelectElement).multiple ? 'listbox' : 'combobox'
    },
    'table': 'table',
    'textarea': 'textbox',
    'ul': 'list',
  }

  const roleOrFunction = implicitRoles[tagName]
  
  if (typeof roleOrFunction === 'function') {
    return roleOrFunction(element)
  }
  
  return roleOrFunction || null
}

/**
 * Check if element is focusable
 */
export function isFocusable(element: Element): boolean {
  const htmlElement = element as HTMLElement

  // Check if element is disabled
  if ('disabled' in htmlElement && (htmlElement as any).disabled) {
    return false
  }

  // Check tabindex
  const tabindex = htmlElement.getAttribute('tabindex')
  if (tabindex !== null) {
    const tabindexValue = parseInt(tabindex, 10)
    // tabindex="-1" means programmatically focusable but not in tab order
    // We still consider it focusable
    return !isNaN(tabindexValue)
  }

  // Check if element is inherently focusable
  const tagName = element.tagName.toLowerCase()
  
  // Links with href are focusable
  if (tagName === 'a' || tagName === 'area') {
    return element.hasAttribute('href')
  }

  // Form elements are focusable (if not disabled)
  const focusableElements = ['button', 'input', 'select', 'textarea']
  if (focusableElements.includes(tagName)) {
    return true
  }

  // Elements with contenteditable
  if (htmlElement.getAttribute('contenteditable') === 'true') {
    return true
  }

  // Audio/video with controls
  if ((tagName === 'audio' || tagName === 'video') && element.hasAttribute('controls')) {
    return true
  }

  // Details element
  if (tagName === 'details') {
    return true
  }

  return false
}

/**
 * Find label element for a form control
 */
function findLabelElement(element: Element): Element | null {
  // Check aria-labelledby first
  const labelledBy = element.getAttribute('aria-labelledby')
  if (labelledBy) {
    return element.ownerDocument?.getElementById(labelledBy) || null
  }

  // Check for <label> with 'for' attribute
  const id = element.id
  if (id) {
    const label = element.ownerDocument?.querySelector(`label[for="${id}"]`)
    if (label) return label
  }

  // Check if element is wrapped in <label>
  return element.closest('label')
}

/**
 * Get ARIA level (for headings, treeitems, etc.)
 */
export function getAriaLevel(element: Element): number | null {
  // Check aria-level attribute
  const ariaLevel = element.getAttribute('aria-level')
  if (ariaLevel) {
    const level = parseInt(ariaLevel, 10)
    if (!isNaN(level) && level >= 1) {
      return level
    }
  }

  // For headings, infer from tag name
  const tagName = element.tagName.toLowerCase()
  const headingMatch = tagName.match(/^h([1-6])$/)
  if (headingMatch) {
    return parseInt(headingMatch[1], 10)
  }

  return null
}

/**
 * Check if element is disabled
 */
export function isDisabled(element: Element): boolean {
  const htmlElement = element as HTMLElement

  // Check disabled attribute
  if ('disabled' in htmlElement && (htmlElement as any).disabled) {
    return true
  }

  // Check aria-disabled
  if (element.getAttribute('aria-disabled') === 'true') {
    return true
  }

  // Check if inside a disabled fieldset
  const fieldset = element.closest('fieldset')
  if (fieldset && (fieldset as HTMLFieldSetElement).disabled) {
    // Exception: elements in the legend are not disabled
    const legend = element.closest('legend')
    if (!legend || !fieldset.contains(legend)) {
      return true
    }
  }

  return false
}

/**
 * Check if element is required
 */
export function isRequired(element: Element): boolean {
  // Check required attribute
  if (element.hasAttribute('required')) {
    return true
  }

  // Check aria-required
  if (element.getAttribute('aria-required') === 'true') {
    return true
  }

  return false
}

/**
 * Get label for element (convenience wrapper)
 */
export function getLabel(element: Element): Element | null {
  return findLabelElement(element)
}