/**
 * Generates a unique CSS selector for a given DOM element.
 * Walks up the tree to build a path from the element to an ancestor with an ID or body.
 */
export function getUniqueSelector(element: Element): string {
  if (!(element instanceof HTMLElement)) {
    return ''
  }

  const path: string[] = []
  let current: HTMLElement | null = element

  while (current && current !== document.body && current !== document.documentElement) {
    let selector = getSelectorForElement(current)
    path.unshift(selector)

    // If we hit an element with an ID, we can stop (IDs are unique)
    if (current.id) {
      break
    }

    current = current.parentElement
  }

  // If we didn't hit an ID, prepend 'body'
  if (current === document.body) {
    path.unshift('body')
  }

  return path.join(' > ')
}

/**
 * Gets a selector string for a single element.
 */
function getSelectorForElement(element: HTMLElement): string {
  // If element has an ID, use it (IDs are unique)
  if (element.id) {
    return `#${CSS.escape(element.id)}`
  }

  const tagName = element.tagName.toLowerCase()
  const parent = element.parentElement

  // If no parent, just return tag name
  if (!parent) {
    return tagName
  }

  // Check if this tag is unique among siblings
  const siblings = Array.from(parent.children)
  const sameTagSiblings = siblings.filter(
    (sibling) => sibling.tagName.toLowerCase() === tagName
  )

  // If tag is unique among siblings, just use tag name
  if (sameTagSiblings.length === 1) {
    return tagName
  }

  // Otherwise, use nth-child
  const index = siblings.indexOf(element) + 1
  return `${tagName}:nth-child(${index})`
}

/**
 * Gets the bounding rect of an element in viewport coordinates.
 * Returns null if the element is not visible.
 */
export function getElementRect(element: Element): DOMRect | null {
  if (!(element instanceof HTMLElement)) {
    return null
  }

  const rect = element.getBoundingClientRect()

  // Check if element is visible (has dimensions)
  if (rect.width === 0 && rect.height === 0) {
    return null
  }

  return rect
}

/**
 * Checks if an element is inside a Shadow DOM.
 */
export function isInShadowDOM(element: Element): boolean {
  let node: Node | null = element
  while (node) {
    if (node instanceof ShadowRoot) {
      return true
    }
    node = node.parentNode
  }
  return false
}

/**
 * Checks if an element is part of our widget (inside pixelpoint-widget-host).
 */
export function isWidgetElement(element: Element): boolean {
  // Check if element is the widget host itself
  if (element instanceof HTMLElement && element.id === 'pixelpoint-widget-host') {
    return true
  }

  let node: Node | null = element
  while (node) {
    if (node instanceof ShadowRoot) {
      const host = node.host
      if (host instanceof HTMLElement && host.id === 'pixelpoint-widget-host') {
        return true
      }
    }
    node = node.parentNode
  }
  return false
}

/**
 * Checks if an event originated from inside our widget using composedPath.
 * This works even when events cross shadow DOM boundaries.
 */
export function isWidgetEvent(event: Event): boolean {
  const path = event.composedPath()
  for (const node of path) {
    if (node instanceof HTMLElement && node.id === 'pixelpoint-widget-host') {
      return true
    }
  }
  return false
}
