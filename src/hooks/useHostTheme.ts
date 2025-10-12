import { useEffect, useState } from 'react';
import { hostCommunication } from '../utils/hostCommunication';

export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  customCSS?: string;
}

export function useHostTheme() {
  const [theme, setTheme] = useState<ThemeConfig>({
    mode: 'light',
  });

  useEffect(() => {
    if (!hostCommunication.getIsEmbedded()) {
      return;
    }

    const unsubscribe = hostCommunication.on('SET_THEME', (themeData: ThemeConfig) => {
      setTheme(themeData);
      applyTheme(themeData);
    });

    return unsubscribe;
  }, []);

  return theme;
}

function applyTheme(theme: ThemeConfig) {
  const root = document.documentElement;

  if (theme.mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  if (theme.primaryColor) {
    root.style.setProperty('--primary-color', theme.primaryColor);
  }

  if (theme.secondaryColor) {
    root.style.setProperty('--secondary-color', theme.secondaryColor);
  }

  if (theme.fontFamily) {
    root.style.setProperty('--font-family', theme.fontFamily);
  }

  if (theme.customCSS) {
    let styleElement = document.getElementById('host-custom-css');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'host-custom-css';
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = theme.customCSS;
  }
}
