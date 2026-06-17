import { expect } from 'vitest';

/**
 * Self-normalizing computed-style read: set `value` on a throwaway div mounted in the
 * document, then read it back through getComputedStyle. Comparing the node's computed
 * value against the tester's computed value puts BOTH through the same engine's
 * serialization (rgb()/lab()/oklch(), font quoting, px units), so the matcher is stable
 * across Chromium and WebKit. (Ported from the jQuery `.css()` tester in test/vitest.setup.js.)
 */
function computedStyleOf(prop: string, value: string): string {
  const tester = document.createElement('div');
  tester.style.setProperty(prop, value);
  document.body.appendChild(tester);
  const computed = getComputedStyle(tester).getPropertyValue(prop);
  tester.remove();
  return computed;
}

expect.extend({
  equalsIgnoreCase(received: unknown, expected: string) {
    const a = String(received).toUpperCase();
    const b = String(expected).toUpperCase();
    return {
      pass: a === b,
      message: (): string =>
        `expected HTML to ${this.isNot ? 'not ' : ''}equal (case-insensitive)\n  received: ${String(received)}\n  expected: ${expected}`,
    };
  },

  equalsStyle(received: unknown, expected: string, prop: string) {
    const nodeStyle = getComputedStyle(received as Element).getPropertyValue(prop);
    const testerStyle = computedStyleOf(prop, expected);
    return {
      pass: nodeStyle === testerStyle,
      message: (): string =>
        `expected computed '${prop}' to ${this.isNot ? 'not ' : ''}match\n  node:   ${nodeStyle}\n  tester: ${testerStyle} (from '${expected}')`,
    };
  },
});

interface SummernoteMatchers<R = unknown> {
  equalsIgnoreCase: (expected: string) => R;
  equalsStyle: (expected: string, prop: string) => R;
}

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> extends SummernoteMatchers<T> {}
  interface AsymmetricMatchersContaining extends SummernoteMatchers {}
}
