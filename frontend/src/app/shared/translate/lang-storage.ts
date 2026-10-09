const LANG_KEY = 'skeleton.lang';

export function getStoredLang(fallback: string): string {
  return localStorage.getItem(LANG_KEY) ?? fallback;
}

export function setStoredLang(lang: string): void {
  localStorage.setItem(LANG_KEY, lang);
}
