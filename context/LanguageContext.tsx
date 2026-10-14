'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Language, Translations, translations } from '../lib/translations';


// Minimal typing for the Google Translate widget, which attaches itself to `window`.
interface GoogleTranslateWindow extends Window {
  google?: {
    translate?: {
      TranslateElement?: new (options: { pageLanguage: string; autoDisplay: boolean }, elementId: string) => unknown;
    };
  };
  googleTranslateElementInit?: () => void;
}

interface LanguageContextType {
  lang: Language;
  dir: 'rtl' | 'ltr';
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: Translations;
  isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'AR',
  dir: 'rtl',
  setLang: () => {},
  toggleLang: () => {},
  t: translations.AR,
  isTranslating: false,
});

function installDOMSafetyPatch() {
  if (typeof window === 'undefined' || typeof Node === 'undefined' || !Node.prototype) return;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };

  const originalReplaceChild = Node.prototype.replaceChild;
  Node.prototype.replaceChild = function <T extends Node>(newChild: Node, oldChild: T): T {
    if (oldChild && oldChild.parentNode !== this) {
      if (this.contains(oldChild)) {
        return originalReplaceChild.call(oldChild.parentNode, newChild, oldChild) as T;
      }
      return newChild as unknown as T;
    }
    return originalReplaceChild.call(this, newChild, oldChild) as T;
  };
}

function setGoogleTransCookie(val: string) {
  if (typeof document === 'undefined') return;
  const hostname = window.location.hostname;
  document.cookie = `googtrans=${val}; path=/;`;
  if (hostname && hostname !== 'localhost') {
    document.cookie = `googtrans=${val}; path=/; domain=${hostname};`;
    const parts = hostname.split('.');
    if (parts.length > 1) {
      const rootDomain = '.' + parts.slice(-2).join('.');
      document.cookie = `googtrans=${val}; path=/; domain=${rootDomain};`;
    }
  }
}

function clearGoogleTransCookie() {
  if (typeof document === 'undefined') return;
  const hostname = window.location.hostname;
  const expired = 'expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = `googtrans=; ${expired}`;
  if (hostname && hostname !== 'localhost') {
    document.cookie = `googtrans=; ${expired} domain=${hostname};`;
    const parts = hostname.split('.');
    if (parts.length > 1) {
      const rootDomain = '.' + parts.slice(-2).join('.');
      document.cookie = `googtrans=; ${expired} domain=${rootDomain};`;
    }
  }
}

function loadGoogleTranslateScript(callback?: () => void) {
  if (typeof window === 'undefined') return;

  installDOMSafetyPatch();

  let container = document.getElementById('google_translate_element') as HTMLDivElement;
  if (!container) {
    container = document.createElement('div');
    container.id = 'google_translate_element';
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '1px';
    container.style.height = '1px';
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '-9999';
    container.style.overflow = 'hidden';
    document.body.appendChild(container);
  }

  const initTranslate = () => {
    try {
      if ((window as GoogleTranslateWindow).google?.translate?.TranslateElement) {
        const mountEl = document.getElementById('google_translate_element');
        if (mountEl) {
          // Clear existing children so TranslateElement can re-mount fresh
          if (mountEl.hasChildNodes()) {
            mountEl.innerHTML = '';
          }
          new (window as GoogleTranslateWindow).google!.translate!.TranslateElement!(
            {
              pageLanguage: 'ar',
              autoDisplay: false,
            },
            'google_translate_element'
          );
        }
        if (callback) callback();
      }
    } catch (err) {
      console.warn('Google Translate init:', err);
    }
  };

  (window as GoogleTranslateWindow).googleTranslateElementInit = initTranslate;

  if ((window as GoogleTranslateWindow).google?.translate?.TranslateElement) {
    initTranslate();
  } else {
    const existingScript = document.getElementById('google-translate-script');
    if (existingScript) {
      // Script tag exists but API not ready yet — poll until it is
      let attempts = 0;
      const timer = setInterval(() => {
        attempts++;
        if ((window as GoogleTranslateWindow).google?.translate?.TranslateElement) {
          clearInterval(timer);
          initTranslate();
        } else if (attempts > 50) {
          clearInterval(timer);
          // Script might be stale/blocked — remove and retry
          existingScript.remove();
          loadGoogleTranslateScript(callback);
        }
      }, 150);
    } else {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.onerror = () => {
        console.warn('Google Translate script failed to load');
        script.remove();
      };
      document.body.appendChild(script);
    }
  }
}

function applyGoogleTranslate(target: 'ar' | 'en') {
  if (typeof window === 'undefined') return;

  if (target === 'en') {
    setGoogleTransCookie('/ar/en');
    loadGoogleTranslateScript(() => {
      setTimeout(() => triggerSelectOrPoll(), 300);
    });
    return;
  } else {
    clearGoogleTransCookie();
    if (!document.getElementById('google-translate-script')) {
      return;
    }
  }

  triggerSelectOrPoll();

  function triggerSelectOrPoll() {
    const triggerSelect = () => {
      const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
      if (!select) return false;

      if (target === 'en') {
        select.value = 'en';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      } else {
        select.selectedIndex = 0;
        select.value = '';
        select.dispatchEvent(new Event('change', { bubbles: true }));

        try {
          const iframe = document.querySelector<HTMLIFrameElement>('.goog-te-banner-frame');
          if (iframe && iframe.contentDocument) {
            const btn = iframe.contentDocument.querySelector<HTMLButtonElement>('.goog-te-button button');
            if (btn) btn.click();
          }
        } catch {}

        if (document.documentElement) {
          document.documentElement.classList.remove('translated-ltr', 'translated-rtl');
        }
        if (document.body) {
          document.body.classList.remove('translated-ltr', 'translated-rtl');
        }
        return true;
      }
    };

    if (!triggerSelect()) {
      let attempts = 0;
      const timer = setInterval(() => {
        attempts++;
        if (triggerSelect() || attempts > 40) {
          clearInterval(timer);
        }
      }, 150);
    }
  }
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [lang, setLangState] = useState<Language>('AR');
  const [isTranslating, setIsTranslating] = useState(false);
  const dir: 'rtl' | 'ltr' = lang === 'AR' ? 'rtl' : 'ltr';

  useEffect(() => {
    try {
      const stored = localStorage.getItem('scope_lang') as Language | null;
      if (stored === 'AR' || stored === 'EN') {
        setLangState(stored);
        if (stored === 'EN') {
          loadGoogleTranslateScript(() => {
            setTimeout(() => applyGoogleTranslate('en'), 350);
          });
        }
      }
    } catch {
    }
  }, []);

  useEffect(() => {
    if (lang === 'EN') {
      const timer = setTimeout(() => {
        applyGoogleTranslate('en');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, lang]);

  useEffect(() => {
    const cleanupObserver = new MutationObserver(() => {
      if (document.body) {
        if (document.body.style.top && document.body.style.top !== '0px') {
          document.body.style.top = '0px';
        }
        if (document.body.style.position && document.body.style.position !== 'static') {
          document.body.style.position = 'static';
        }
      }

      const bannerFrames = document.querySelectorAll<HTMLElement>(
        '.goog-te-banner-frame, iframe.goog-te-banner-frame'
      );
      bannerFrames.forEach((el) => {
        el.style.setProperty('display', 'none', 'important');
      });
    });

    cleanupObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => cleanupObserver.disconnect();
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', lang === 'AR' ? 'ar' : 'en');
      document.documentElement.setAttribute('dir', dir);
    }
  }, [lang, dir]);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    setIsTranslating(true);
    try {
      localStorage.setItem('scope_lang', newLang);
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('lang', newLang === 'AR' ? 'ar' : 'en');
        document.documentElement.setAttribute('dir', newLang === 'AR' ? 'rtl' : 'ltr');
      }
    } catch {}

    applyGoogleTranslate(newLang === 'EN' ? 'en' : 'ar');
    setTimeout(() => setIsTranslating(false), 600);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'AR' ? 'EN' : 'AR');
  }, [lang, setLang]);

  return (
    <LanguageContext.Provider
      value={{
        lang,
        dir,
        setLang,
        toggleLang,
        t: translations[lang],
        isTranslating,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
