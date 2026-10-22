'use client';

import { useEffect } from 'react';

export function ThemeBootstrap() {
  useEffect(() => {
    const root = document.documentElement;
    const theme = localStorage.getItem('teenwork-theme');
    const mode = localStorage.getItem('teenwork-mode');
    const density = localStorage.getItem('teenwork-density');
    const reduceMotion = localStorage.getItem('teenwork-reduce-motion');
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      if (theme && ['classic', 'forest', 'violet', 'sunset'].includes(theme)) root.dataset.theme = theme;
      if (mode && ['light', 'dark', 'system'].includes(mode)) {
        root.dataset.mode = mode === 'system' ? (media.matches ? 'dark' : 'light') : mode;
      }
      if (density && ['comfortable', 'compact'].includes(density)) root.dataset.density = density;
      if (reduceMotion === 'true' || reduceMotion === 'false') root.dataset.reduceMotion = reduceMotion;
    };

    apply();
    const onSystemThemeChange = () => {
      if (localStorage.getItem('teenwork-mode') === 'system') root.dataset.mode = media.matches ? 'dark' : 'light';
    };
    media.addEventListener('change', onSystemThemeChange);
    return () => media.removeEventListener('change', onSystemThemeChange);
  }, []);

  return null;
}
