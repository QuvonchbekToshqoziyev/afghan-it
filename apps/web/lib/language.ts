'use client';

import { useEffect, useState } from 'react';

export type Language = 'fa' | 'ps' | 'en';
export type TranslatedContent = { title: string; description: string; translations?: Partial<Record<Language, { title?: string; description?: string }>> };

const STORAGE_KEY = 'afghan-it.language';
const EVENT_NAME = 'afghan-it.language-change';

export function useLanguage() {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    const selected = saved === 'fa' || saved === 'ps' || saved === 'en' ? saved : 'en';
    localStorage.setItem(STORAGE_KEY, selected);
    setLanguage(selected);
    document.documentElement.lang = selected;
    document.documentElement.dir = selected === 'en' ? 'ltr' : 'rtl';
    const update = (event: Event) => setLanguage((event as CustomEvent<Language>).detail);
    window.addEventListener(EVENT_NAME, update);
    return () => window.removeEventListener(EVENT_NAME, update);
  }, []);

  function changeLanguage(next: Language) {
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === 'en' ? 'ltr' : 'rtl';
    setLanguage(next);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
  }

  return { language, changeLanguage };
}

export function localize<T extends TranslatedContent>(item: T, language: Language) {
  const translated = item.translations?.[language];
  return { ...item, title: translated?.title || item.title, description: translated?.description || item.description };
}
