/**
 * jQuery-free test utilities (ported from test/util.js, extended for the React+TS port).
 * Browser-mode only — runs against real Chromium and WebKit.
 */

export function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Parse an HTML string into its first element (replaces `$(html)[0]`). */
export function h(html: string): HTMLElement {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  const el = template.content.firstElementChild;
  if (!(el instanceof HTMLElement)) {
    throw new Error(`h(): expected an HTMLElement from: ${html}`);
  }
  return el;
}

const mounted: HTMLElement[] = [];

/** Append an element (or parsed HTML) to document.body; tracked for resetDom(). */
export function mount(elOrHtml: HTMLElement | string): HTMLElement {
  const el = typeof elOrHtml === 'string' ? h(elOrHtml) : elOrHtml;
  document.body.appendChild(el);
  mounted.push(el);
  return el;
}

/** Remove everything mount()ed and clear the body — call in afterEach to isolate tests. */
export function resetDom(): void {
  for (const el of mounted.splice(0)) {
    el.remove();
  }
  document.body.innerHTML = '';
}

export function findEl(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector(selector);
  if (!(el instanceof HTMLElement)) {
    throw new Error(`findEl(): no element for selector "${selector}"`);
  }
  return el;
}

export function dispatchKey(
  target: EventTarget,
  type: 'keydown' | 'keyup' | 'keypress',
  init: KeyboardEventInit = {},
): KeyboardEvent {
  const ev = new KeyboardEvent(type, { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(ev);
  return ev;
}

/** Fire a native beforeinput/input event. `init.inputType`/`init.data` drive the engine's
 *  inputType-based intent detection (the Android keyCode-229 / IME-safe path). */
export function dispatchInput(
  target: EventTarget,
  type: 'beforeinput' | 'input',
  init: InputEventInit = {},
): InputEvent {
  const ev = new InputEvent(type, { bubbles: true, cancelable: type === 'beforeinput', ...init });
  target.dispatchEvent(ev);
  return ev;
}

/** Fire a composition event (for IME/Hangul/CJK composition-state-machine tests). */
export function dispatchComposition(
  target: EventTarget,
  type: 'compositionstart' | 'compositionupdate' | 'compositionend',
  data = '',
): CompositionEvent {
  const ev = new CompositionEvent(type, { bubbles: true, cancelable: true, data });
  target.dispatchEvent(ev);
  return ev;
}

/** Fire a paste event carrying html/text. Built robustly across engines: WebKit ignores
 *  clipboardData passed to the ClipboardEvent constructor, so the property is forced. */
export function dispatchPaste(target: EventTarget, payload: { html?: string; text?: string }): Event {
  const dt = new DataTransfer();
  if (payload.text !== undefined) {
    dt.setData('text/plain', payload.text);
  }
  if (payload.html !== undefined) {
    dt.setData('text/html', payload.html);
  }
  const ev = new Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'clipboardData', { value: dt, configurable: true });
  target.dispatchEvent(ev);
  return ev;
}
