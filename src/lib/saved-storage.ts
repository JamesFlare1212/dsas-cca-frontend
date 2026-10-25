import type { ClubBasic } from '#lib/types.js';
import { safeImageUrl } from '#lib/api.js';

export function parseSaved(raw: string | null): ClubBasic[] {
  try {
    const data: unknown = JSON.parse(raw || '[]');
    if (!Array.isArray(data)) return [];
    const seen = new Set<string>();
    return data.flatMap((item: unknown) => {
      if (!item || typeof item !== 'object') return [];
      const club = item as Record<string, unknown>;
      if (
        typeof club.id !== 'string' ||
        !/^\d+$/.test(club.id) ||
        typeof club.name !== 'string' ||
        seen.has(club.id)
      )
        return [];
      seen.add(club.id);
      return [{ id: club.id, name: club.name, photo: safeImageUrl(club.photo) }];
    });
  } catch {
    return [];
  }
}
