import { useEffect, useState } from 'preact/hooks';

let currentLight = false;
const listeners = new Set<(light: boolean) => void>();

export function getIsLight(): boolean {
  return currentLight;
}

export function setIsLight(light: boolean): void {
  if (currentLight === light) return;
  currentLight = light;
  for (const listener of listeners) listener(light);
}

function onIsLightChange(listener: (light: boolean) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Reactive accessor so Monaco (and other non-CSS state) can follow the mode. */
export function useIsLight(): boolean {
  const [light, setLight] = useState(getIsLight());
  useEffect(() => onIsLightChange(setLight), []);
  return light;
}