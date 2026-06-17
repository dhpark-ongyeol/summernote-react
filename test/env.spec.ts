import { describe, it, expect } from 'vitest';
import { detectEnv, type NavigatorLike, type WindowLike } from '../src/engine/core/env';

function win(overrides: Partial<WindowLike> & { coarse?: boolean; touch?: boolean } = {}): WindowLike {
  const w: Record<string, unknown> = {
    document: globalThis.document,
    matchMedia: (q: string) => ({ matches: !!overrides.coarse && /coarse/.test(q) }),
  };
  if (overrides.PointerEvent !== undefined) w.PointerEvent = overrides.PointerEvent;
  if (overrides.visualViewport !== undefined) w.visualViewport = overrides.visualViewport;
  if (overrides.touch) w.ontouchstart = null;
  return w as WindowLike;
}

const UA = {
  desktopChrome:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  desktopSafari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  desktopFirefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  iosSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  iosChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0 Mobile/15E148 Safari/604.1',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  samsung:
    'Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
};

describe('env.detectEnv — engine-accurate classification', () => {
  it('desktop Chrome is Blink, not WebKit/Safari', () => {
    const e = detectEnv({ userAgent: UA.desktopChrome, platform: 'MacIntel', maxTouchPoints: 0 }, win());
    expect(e.isBlink).toBe(true);
    expect(e.isAppleWebKit).toBe(false);
    expect(e.isSafari).toBe(false);
    expect(e.isIOS).toBe(false);
    expect(e.isMac).toBe(true);
  });

  it('desktop Safari is AppleWebKit + Safari, not Blink', () => {
    const e = detectEnv({ userAgent: UA.desktopSafari, platform: 'MacIntel', maxTouchPoints: 0 }, win());
    expect(e.isAppleWebKit).toBe(true);
    expect(e.isSafari).toBe(true);
    expect(e.isBlink).toBe(false);
  });

  it('Firefox is FF, neither Blink nor WebKit', () => {
    const e = detectEnv({ userAgent: UA.desktopFirefox, platform: 'Win32', maxTouchPoints: 0 }, win());
    expect(e.isFF).toBe(true);
    expect(e.isBlink).toBe(false);
    expect(e.isAppleWebKit).toBe(false);
  });

  it('iOS Safari is iOS + AppleWebKit + Safari', () => {
    const e = detectEnv({ userAgent: UA.iosSafari, platform: 'iPhone', maxTouchPoints: 5 }, win({ touch: true }));
    expect(e.isIOS).toBe(true);
    expect(e.isAppleWebKit).toBe(true);
    expect(e.isSafari).toBe(true);
    expect(e.isBlink).toBe(false);
    expect(e.isMac).toBe(true); // iOS uses ⌘ shortcuts
  });

  it('iOS Chrome (CriOS) is AppleWebKit but NOT Safari and NOT Blink (WebKit underneath)', () => {
    const e = detectEnv({ userAgent: UA.iosChrome, platform: 'iPhone', maxTouchPoints: 5 }, win({ touch: true }));
    expect(e.isIOS).toBe(true);
    expect(e.isAppleWebKit).toBe(true);
    expect(e.isSafari).toBe(false);
    expect(e.isBlink).toBe(false);
  });

  it('iPadOS desktop-mode (MacIntel + touch) is detected as iOS', () => {
    const e = detectEnv({ userAgent: UA.desktopSafari, platform: 'MacIntel', maxTouchPoints: 5 }, win({ touch: true }));
    expect(e.isIOS).toBe(true);
    expect(e.isAppleWebKit).toBe(true);
  });

  it('Android Chrome is Blink + Android, not WebKit', () => {
    const e = detectEnv({ userAgent: UA.androidChrome, platform: 'Linux armv8l', maxTouchPoints: 5 }, win({ touch: true }));
    expect(e.isAndroid).toBe(true);
    expect(e.isBlink).toBe(true);
    expect(e.isAppleWebKit).toBe(false);
    expect(e.isSafari).toBe(false);
  });

  it('Samsung Internet is Blink + Samsung + Android', () => {
    const e = detectEnv({ userAgent: UA.samsung, platform: 'Linux armv8l', maxTouchPoints: 5 }, win({ touch: true }));
    expect(e.isSamsungInternet).toBe(true);
    expect(e.isBlink).toBe(true);
    expect(e.isAndroid).toBe(true);
  });

  it('Chromium Edge is Blink + Edge, not Safari', () => {
    const e = detectEnv({ userAgent: UA.edge, platform: 'Win32', maxTouchPoints: 0 }, win());
    expect(e.isEdge).toBe(true);
    expect(e.isBlink).toBe(true);
    expect(e.isSafari).toBe(false);
  });
});

describe('env.detectEnv — feature detection', () => {
  it('reflects PointerEvent / visualViewport / virtualKeyboard presence', () => {
    const e = detectEnv(
      { userAgent: UA.androidChrome, maxTouchPoints: 5, virtualKeyboard: {} },
      win({ PointerEvent: function () {}, visualViewport: {}, touch: true }),
    );
    expect(e.hasPointerEvent).toBe(true);
    expect(e.hasVisualViewport).toBe(true);
    expect(e.hasVirtualKeyboard).toBe(true);
    expect(e.isSupportTouch).toBe(true);
  });

  it('coarse pointer reflects matchMedia', () => {
    const coarse = detectEnv({ userAgent: UA.iosSafari, maxTouchPoints: 5 }, win({ coarse: true }));
    const fine = detectEnv({ userAgent: UA.desktopChrome, maxTouchPoints: 0 }, win({ coarse: false }));
    expect(coarse.isCoarsePointer).toBe(true);
    expect(fine.isCoarsePointer).toBe(false);
  });

  it('falls back to maxTouchPoints when matchMedia is absent', () => {
    const e = detectEnv({ userAgent: UA.androidChrome, maxTouchPoints: 5 }, { document: globalThis.document });
    expect(e.isCoarsePointer).toBe(true);
    expect(e.isSupportTouch).toBe(true);
  });
});
