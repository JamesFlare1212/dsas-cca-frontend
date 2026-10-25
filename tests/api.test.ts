import { afterEach, describe, expect, spyOn, test } from 'bun:test';
import { activityQuery, fetchJson, getClubDetail, getClubs, toClubs, toStaff } from '#lib/api.js';
import { readFilters } from '#lib/catalog.js';

const originalFetch = globalThis.fetch;
const mockFetch = (handler: () => Promise<Response>) =>
  Object.assign(handler, { preconnect: originalFetch.preconnect });
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('API requests', () => {
  test('does not render API cache metadata as staff members', () => {
    expect(
      toStaff({
        'CL1-1000': 'Mr Dan Achiroae',
        lastCheck: '2026-10-23T10:40:44.531Z',
        cache: 'HIT',
        missing: null,
        blank: ' ',
      }),
    ).toEqual([{ id: 'CL1-1000', name: 'Mr Dan Achiroae' }]);
  });
  test('encodes special categories and preserves an explicit false leader filter', () => {
    const query = new URLSearchParams(
      activityQuery({
        category: 'Sport & Health',
        academicYear: '2026/2027',
        leader: 'staff',
        grade: '1',
      }),
    );
    expect(query.get('category')).toBe('Sport & Health');
    expect(query.get('academicYear')).toBe('2026/2027');
    expect(query.get('isStudentLed')).toBe('false');
    expect(query.get('grade')).toBe('1');
    expect(activityQuery({ category: 'all', grade: 'all', leader: 'all' })).toBe('');
  });
  test.each(Array.from({ length: 15 }, (_, index) => String(index - 2)))(
    'preserves shared grade=%s in a combined API request',
    async (grade) => {
      const fetch = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({}));
      const filters = readFilters(
        new URLSearchParams({
          grade,
          year: '2026/2027',
          category: 'Sport & Health',
          leader: 'staff',
        }),
      );
      await getClubs(filters);
      const url = new URL(String(fetch.mock.calls[0][0]));
      expect(url.pathname).toBe('/v1/activity/list');
      expect(Object.fromEntries(url.searchParams)).toEqual({
        grade,
        academicYear: '2026/2027',
        category: 'Sport & Health',
        isStudentLed: 'false',
      });
    },
  );
  test.each(['-3', '13', '', '1.5', '-1.0', '-0', '-01', '01', '+1', 'abc'])(
    'ignores invalid grade=%s in shared links and API requests',
    (grade) => {
      expect(readFilters(new URLSearchParams({ grade })).grade).toBe('all');
      expect(activityQuery({ grade })).toBe('');
    },
  );
  test('normalizes list records and gracefully handles missing images', () => {
    expect(
      toClubs({
        '1': { name: 'Art', photo: 'https://example.com/image.avif' },
        '2': { name: 'Music', photo: '' },
      }),
    ).toHaveLength(2);
  });
  test('does not repeatedly request a missing activity', async () => {
    const fetch = spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 404 }));
    await expect(fetchJson('/missing')).rejects.toThrow('no longer available');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  test('retries a server failure once and can recover', async () => {
    const fetch = spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(Response.json({ ok: true }));
    expect(await fetchJson('/recover')).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  test('stops after two failed attempts', async () => {
    const fetch = spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 503 }));
    await expect(fetchJson('/down')).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  test('cancels obsolete filter requests before sending them', async () => {
    const fetch = spyOn(globalThis, 'fetch');
    const controller = new AbortController();
    controller.abort();
    await expect(fetchJson('/cancel', controller.signal)).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('detail request scheduling', () => {
  const detail = { name: 'Test activity', photo: '', meeting: {}, grades: {} };
  test('coalesces simultaneous requests and caches completed details', async () => {
    const fetch = spyOn(globalThis, 'fetch').mockImplementation(
      mockFetch(async () => Response.json(detail)),
    );
    await Promise.all([getClubDetail('900001'), getClubDetail('900001'), getClubDetail('900001')]);
    await getClubDetail('900001');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  test('limits detail traffic to six simultaneous requests', async () => {
    let active = 0;
    let peak = 0;
    spyOn(globalThis, 'fetch').mockImplementation(
      mockFetch(async () => {
        active++;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active--;
        return Response.json(detail);
      }),
    );
    await Promise.all(
      Array.from({ length: 15 }, (_, index) => getClubDetail(String(900010 + index))),
    );
    expect(peak).toBe(6);
    expect(active).toBe(0);
  });
  test('allows a fresh attempt after a detail request fails', async () => {
    const fetch = spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('', { status: 404 }))
      .mockResolvedValueOnce(Response.json(detail));
    await expect(getClubDetail('900100')).rejects.toThrow();
    expect((await getClubDetail('900100')).name).toBe('Test activity');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
