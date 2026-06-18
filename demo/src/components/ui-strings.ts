import type { Locale } from '../lib/docs';

export interface UiStrings {
  docs: string;
  playground: string;
  documentation: string;
  onThisPage: string;
  previous: string;
  next: string;
  fallbackBanner: string;
  /** Sidebar group labels, keyed by the English section name in DOC_ORDER. */
  sections: Record<string, string>;
}

// Site chrome strings (NOT the doc content — that lives in the .md files). Keyed by locale.
export const UI: Record<Locale, UiStrings> = {
  en: {
    docs: 'Docs',
    playground: 'Playground',
    documentation: 'Documentation',
    onThisPage: 'On this page',
    previous: 'Previous',
    next: 'Next',
    fallbackBanner: 'This page has not been translated yet — showing the English version.',
    sections: { Tutorial: 'Tutorial', 'How-to': 'How-to', Reference: 'Reference', Explanation: 'Explanation' },
  },
  ko: {
    docs: '문서',
    playground: '플레이그라운드',
    documentation: '문서',
    onThisPage: '이 페이지 목차',
    previous: '이전',
    next: '다음',
    fallbackBanner: '이 페이지는 아직 번역되지 않아 영문으로 표시됩니다.',
    sections: { Tutorial: '튜토리얼', 'How-to': '사용법', Reference: '레퍼런스', Explanation: '설명' },
  },
};

export const t = (locale: Locale): UiStrings => UI[locale];
