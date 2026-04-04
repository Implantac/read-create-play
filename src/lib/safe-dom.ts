/**
 * Safe DOM manipulation utilities.
 * Prevents "Cannot read properties of null" errors by validating elements
 * before any operation. Logs warnings in development for debugging.
 */

const isDev = import.meta.env.DEV;

function warn(msg: string) {
  if (isDev) console.warn(`[safe-dom] ${msg}`);
}

/** Safely append a child to a parent element */
export function safeAppend(parent: Element | null | undefined, child: Node): boolean {
  if (!parent) {
    warn("safeAppend: parent is null");
    return false;
  }
  parent.appendChild(child);
  return true;
}

/** Safely query a single element */
export function safeQuery<T extends Element = Element>(
  selector: string,
  scope: ParentNode = document
): T | null {
  try {
    return scope.querySelector<T>(selector);
  } catch {
    warn(`safeQuery: invalid selector "${selector}"`);
    return null;
  }
}

/** Safely set innerHTML */
export function safeSetHTML(el: Element | null | undefined, html: string): boolean {
  if (!el) {
    warn("safeSetHTML: element is null");
    return false;
  }
  el.innerHTML = html;
  return true;
}

/** Safely get element by ID */
export function safeGetById<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

/** Create and append a temporary DOM element with auto-cleanup */
export function createTempElement(
  tag: string,
  styles: Partial<CSSStyleDeclaration>,
  duration: number
): HTMLElement | null {
  if (!document.body) {
    warn("createTempElement: document.body not available");
    return null;
  }
  const el = document.createElement(tag);
  Object.assign(el.style, styles);
  document.body.appendChild(el);
  setTimeout(() => el.remove(), duration);
  return el;
}
