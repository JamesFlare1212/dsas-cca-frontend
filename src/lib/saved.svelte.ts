import type { ClubBasic } from '#lib/types.js';
import { parseSaved } from '#lib/saved-storage.js';

const STORAGE_KEY = 'dsas-saved-activities';

export const saved = $state({ clubs: [] as ClubBasic[], ready: false });

export function loadSaved(): () => void {
  try {
    saved.clubs = parseSaved(localStorage.getItem(STORAGE_KEY));
  } catch {
    /* Session only. */
  }
  saved.ready = true;
  const sync = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) saved.clubs = parseSaved(event.newValue);
  };
  window.addEventListener('storage', sync);
  return () => window.removeEventListener('storage', sync);
}

export function isSaved(id: string): boolean {
  return saved.clubs.some((club) => club.id === id);
}

export function toggleSaved(club: ClubBasic): { added: boolean; persisted: boolean } {
  const added = !isSaved(club.id);
  const updated = added
    ? [...saved.clubs, { id: club.id, name: club.name, photo: club.photo }]
    : saved.clubs.filter((item) => item.id !== club.id);
  saved.clubs = updated;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return { added, persisted: true };
  } catch {
    return { added, persisted: false };
  }
}
