const STORAGE_KEY = "safetrust:recent-hosts";
const MAX_ENTRIES = 5;

export function getRecentHosts(): string[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addRecentHost(address: string): void {
  const existing = getRecentHosts().filter((a) => a !== address);
  const updated = [address, ...existing].slice(0, MAX_ENTRIES);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
