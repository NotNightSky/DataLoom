import { useEffect, useState } from 'preact/hooks';

type Accent = 'teal' | 'purple';

const STORAGE_MODE_KEY = 'dataloom-mode';
const STORAGE_ACCENT_KEY = 'dataloom-accent';

const getStoredMode = (): string | null => {
  try {
    return window.localStorage.getItem(STORAGE_MODE_KEY);
  } catch {
    return null;
  }
};

const getStoredAccent = (): Accent => {
  try {
    const saved = window.localStorage.getItem(STORAGE_ACCENT_KEY);
    return saved === 'purple' ? 'purple' : 'teal';
  } catch {
    return 'teal';
  }
};

const getSystemIsLight = (): boolean => window.matchMedia('(prefers-color-scheme: light)').matches;

const getInitialMode = (): boolean => {
  const saved = getStoredMode();
  if (saved === 'light' || saved === 'dark') return saved === 'light';
  return getSystemIsLight();
};

const getInitialAccent = (): Accent => getStoredAccent();

let isLight = getInitialMode();
let accent: Accent = getInitialAccent();
const listeners = new Set<() => void>();

const updateDOM = () => {
  const nextTheme = isLight
    ? accent === 'teal'
      ? 'light-teal'
      : 'light'
    : accent === 'teal'
      ? 'teal'
      : 'purple';

  document.documentElement.setAttribute('data-theme', nextTheme);
};

const notify = () => {
  for (const listener of listeners) listener();
};

if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
  const handleSystemThemeChange = (event: MediaQueryListEvent) => {
    if (!getStoredMode()) {
      isLight = event.matches;
      updateDOM();
      notify();
    }
  };

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handleSystemThemeChange);
  } else if (typeof mediaQuery.addListener === 'function') {
    mediaQuery.addListener(handleSystemThemeChange);
  }
}

export function getIsLight(): boolean {
  return isLight;
}

export function getAccent(): Accent {
  return accent;
}

export function setIsLight(light: boolean): void {
  isLight = light;
  try {
    window.localStorage.setItem(STORAGE_MODE_KEY, light ? 'light' : 'dark');
  } catch {
    // ignore storage write failures
  }
  updateDOM();
  notify();
}

export function setAccent(newAccent: Accent): void {
  accent = newAccent;
  try {
    window.localStorage.setItem(STORAGE_ACCENT_KEY, newAccent);
  } catch {
    // ignore storage write failures
  }
  updateDOM();
  notify();
}

export function useTheme(): { isLight: boolean; accent: Accent } {
  const [state, setState] = useState({ isLight, accent });

  useEffect(() => {
    const listener = () => setState({ isLight, accent });
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  return state;
}

/** Reactive accessor so Monaco (and other non-CSS state) can follow the mode. */
export function useIsLight(): boolean {
  return useTheme().isLight;
}

updateDOM();