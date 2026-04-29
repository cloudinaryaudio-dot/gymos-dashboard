import { useEffect } from 'react';

/**
 * Adds the `theme-public` class to <html> and <body> while a public-facing
 * page is mounted. Used by LandingPage and all related public pages
 * (/plans, /services, /trainers, /gallery, /branches, /products, etc.) so
 * the mobile-responsive CSS scope in index.css applies consistently.
 */
export function usePublicTheme() {
  useEffect(() => {
    document.documentElement.classList.add('theme-public');
    document.body.classList.add('theme-public');
    return () => {
      document.documentElement.classList.remove('theme-public');
      document.body.classList.remove('theme-public');
    };
  }, []);
}
