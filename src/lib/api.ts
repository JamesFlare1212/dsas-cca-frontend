import type { ClubBasic, ClubDetail, Counts, Filters, StaffMember } from '#lib/types.js';
import { isGrade } from '#lib/grades.js';

export const API_BASE = import.meta.env.PUBLIC_API_BASE_URL || 'https://dsas-cca.jamesflare.com/v1';

export class ApiError extends Error {
  constructor(public status: number) {
    super(
      status === 404
        ? 'This activity is no longer available.'
        : 'Unable to connect. Please try again.',
    );
    this.name = 'ApiError';
  }
}

export async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    signal?.throwIfAborted();
    try {
      const timeout = AbortSignal.timeout(12_000);
      const response = await fetch(`${API_BASE}${path}`, {
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new ApiError(response.status);
      return (await response.json()) as T;
    } catch (error) {
      signal?.throwIfAborted();
      if (
        attempt === 1 ||
        (error instanceof ApiError && error.status < 500 && error.status !== 429)
      ) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }
  throw new Error('Unable to connect. Please try again.');
}

export function activityQuery(filters: Partial<Filters>): string {
  const query = new URLSearchParams();
  if (filters.category && filters.category !== 'all') query.set('category', filters.category);
  if (filters.academicYear && filters.academicYear !== 'all') {
    query.set('academicYear', filters.academicYear);
  }
  if (isGrade(filters.grade)) query.set('grade', filters.grade);
  if (filters.leader === 'student' || filters.leader === 'staff') {
    query.set('isStudentLed', String(filters.leader === 'student'));
  }
  return query.toString();
}

export function toClubs(data: Record<string, Omit<ClubBasic, 'id'>>): ClubBasic[] {
  return Object.entries(data)
    .filter(([, item]) => item && typeof item.name === 'string')
    .map(([id, item]) => ({ id, name: item.name, photo: safeImageUrl(item.photo) }));
}

export function safeImageUrl(value: unknown): string {
  if (typeof value !== 'string' || !value) return '';
  try {
    return new URL(value).protocol === 'https:' ? value : '';
  } catch {
    return '';
  }
}

export async function getClubs(
  filters: Partial<Filters>,
  signal?: AbortSignal,
): Promise<ClubBasic[]> {
  const query = activityQuery(filters);
  const data = await fetchJson<Record<string, Omit<ClubBasic, 'id'>>>(
    `/activity/list${query ? `?${query}` : ''}`,
    signal,
  );
  return toClubs(data);
}

export const getCategories = (signal?: AbortSignal) =>
  fetchJson<Counts>('/activity/category', signal);
export const getAcademicYears = (signal?: AbortSignal) =>
  fetchJson<Counts>('/activity/academicYear', signal);

export async function getStaff(signal?: AbortSignal): Promise<StaffMember[]> {
  const data = await fetchJson<Record<string, string>>('/staffs', signal);
  return toStaff(data);
}

export function toStaff(data: Record<string, unknown>): StaffMember[] {
  // The endpoint includes cache metadata beside its staff ID → name entries.
  return Object.entries(data).flatMap(([id, name]) =>
    id !== 'cache' && id !== 'lastCheck' && typeof name === 'string' && name.trim()
      ? [{ id, name }]
      : [],
  );
}

/** Shared, bounded detail requests: cards and dialogs never request the same ID twice. */
const detailCache = new Map<string, ClubDetail>();
const pendingDetails = new Map<string, Promise<ClubDetail>>();
const waiting: (() => void)[] = [];
let activeRequests = 0;

async function withDetailSlot<T>(task: () => Promise<T>): Promise<T> {
  if (activeRequests >= 6) await new Promise<void>((resolve) => waiting.push(resolve));
  else activeRequests++;
  try {
    return await task();
  } finally {
    const next = waiting.shift();
    if (next) next();
    else activeRequests--;
  }
}

export function getCachedDetail(id: string): ClubDetail | undefined {
  return detailCache.get(id);
}

export function getClubDetail(id: string): Promise<ClubDetail> {
  const cached = detailCache.get(id);
  if (cached) return Promise.resolve(cached);
  const pending = pendingDetails.get(id);
  if (pending) return pending;

  const request = withDetailSlot(async () => {
    const detail = await fetchJson<ClubDetail>(`/activity/${encodeURIComponent(id)}`);
    if (!detail || typeof detail.name !== 'string' || !detail.meeting || !detail.grades) {
      throw new Error('Activity information is temporarily unavailable.');
    }
    detail.photo = safeImageUrl(detail.photo);
    detailCache.set(id, detail);
    if (detailCache.size > 250) detailCache.delete(detailCache.keys().next().value!);
    return detail;
  }).finally(() => pendingDetails.delete(id));

  pendingDetails.set(id, request);
  return request;
}
