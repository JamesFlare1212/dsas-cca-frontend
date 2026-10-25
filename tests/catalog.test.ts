import { describe, expect, test } from 'bun:test';
import {
  costLabel,
  gradeRange,
  meetingsFor,
  locationLabel,
  readFilters,
  searchClubs,
  searchStaff,
} from '#lib/catalog.js';
import { parseSaved } from '#lib/saved-storage.js';
import { gradeOptions } from '#lib/grades.js';
import type { ClubDetail } from '#lib/types.js';

describe('activity discovery', () => {
  const clubs = [
    { id: '9', name: 'Basketball 篮球', photo: '' },
    { id: '12', name: 'Art Lab 美术', photo: '' },
    { id: '100', name: 'Robotics Club 机器人', photo: '' },
  ];
  test('searches Chinese names, IDs and small spelling mistakes', () => {
    expect(searchClubs(clubs, '机器人', 'newest')[0]?.id).toBe('100');
    expect(searchClubs(clubs, 'basketbal', 'newest')[0]?.id).toBe('9');
    expect(searchClubs(clubs, '12', 'newest')[0]?.id).toBe('12');
  });
  test('sorts numeric IDs without mutating the input', () => {
    expect(searchClubs(clubs, '', 'newest').map(({ id }) => id)).toEqual(['100', '12', '9']);
    expect(clubs[0].id).toBe('9');
    expect(searchClubs(clubs, '', 'name-asc')[0].id).toBe('12');
  });
  test('prefers direct matches before offering fuzzy alternatives', () => {
    const similar = [...clubs, { id: '200', name: 'Baseball', photo: '' }];
    expect(searchClubs(similar, 'Basketball', 'newest').map(({ id }) => id)).toEqual(['9']);
  });
  test('ignores invalid grade and leader parameters in shared links', () => {
    const filters = readFilters(new URLSearchParams('grade=13&leader=unknown&year=2025%2F2026'));
    expect(filters).toEqual({
      grade: 'all',
      leader: 'all',
      academicYear: '2025/2026',
      category: 'all',
    });
  });
  test('searches staff by both name and staff ID', () => {
    const staff = [
      { id: 'CL1-1000', name: 'Mr Dan Achiroae' },
      { id: 'CL1-1001', name: 'Ms Amanda Milne' },
    ];
    expect(searchStaff(staff, 'Amanda')[0]?.id).toBe('CL1-1001');
    expect(searchStaff(staff, 'CL1-1000')[0]?.name).toBe('Mr Dan Achiroae');
  });
});

describe('real API detail conventions', () => {
  test('shows room, block and campus, omitting only empty location fields', () => {
    expect(locationLabel({ room: 'B3036', block: 'Upper Secondary', site: 'Wuxi Campus' })).toBe(
      'B3036 · Upper Secondary · Wuxi Campus',
    );
    expect(locationLabel({ room: 'B3036', block: ' ', site: 'Wuxi Campus' })).toBe(
      'B3036 · Wuxi Campus',
    );
    expect(locationLabel({ room: '', block: '', site: '' })).toBe('Location to be confirmed');
  });
  test('distinguishes an unspecified cost from a free activity', () => {
    expect(costLabel(null)).toBe('Not specified');
    expect(costLabel('')).toBe('Not specified');
    expect(costLabel('0')).toBe('Free');
    expect(costLabel('FREE')).toBe('Free');
    expect(costLabel('RMB 3000 per semester')).toBe('RMB 3000 per semester');
  });
  test('preserves multiple meetings and supports the legacy single meeting', () => {
    const meeting = {
      day: 'Monday',
      startTime: '16:00',
      endTime: '17:00',
      location: { block: '', room: 'Gym', site: 'Wuxi' },
    };
    expect(meetingsFor({ meeting } as ClubDetail)).toEqual([meeting]);
    const meetings = [meeting, { ...meeting, day: 'Thursday' }];
    expect(meetingsFor({ meeting, meetings } as ClubDetail)).toEqual(meetings);
  });
  test('uses normalized grade codes for kindergarten labels', () => {
    expect(
      gradeRange({
        grades: { min: '-1', max: '0' },
        schedule: '2026.27 S1 KG2 & KG3',
      } as ClubDetail),
    ).toBe('KG2–KG3');
    expect(
      gradeRange({ grades: { min: '7', max: '12' }, schedule: '2026.27 S1 G7-12' } as ClubDetail),
    ).toBe('G7–G12');
  });
  test.each([
    ['-2', '-2', 'KG1'],
    ['-1', '-1', 'KG2'],
    ['0', '0', 'KG3'],
    ['-2', '0', 'KG1–KG3'],
    ['1', '1', 'G1'],
    ['1', '12', 'G1–G12'],
    [null, null, 'Not specified'],
    [null, '0', 'Not specified'],
    ['-3', '0', 'Not specified'],
    ['3', '2', 'Not specified'],
  ])('formats grade range %s..%s as %s without a schedule', (min, max, label) => {
    expect(gradeRange({ grades: { min, max } } as ClubDetail)).toBe(label);
  });
  test('does not reinterpret positive primary codes using a kindergarten schedule', () => {
    expect(
      gradeRange({ grades: { min: '2', max: '3' }, schedule: 'KG2 & KG3' } as ClubDetail),
    ).toBe('G2–G3');
  });
  test('offers Grade 12 through KG1 in descending order, with All grades first', () => {
    expect(gradeOptions.slice(0, 5)).toEqual([
      { value: 'all', label: 'All grades' },
      { value: '12', label: 'Grade 12' },
      { value: '11', label: 'Grade 11' },
      { value: '10', label: 'Grade 10' },
      { value: '9', label: 'Grade 9' },
    ]);
    expect(gradeOptions).toHaveLength(16);
    expect(gradeOptions.slice(-3)).toEqual([
      { value: '0', label: 'KG3' },
      { value: '-1', label: 'KG2' },
      { value: '-2', label: 'KG1' },
    ]);
  });
});

describe('saved activities', () => {
  test('recovers from malformed or non-array local storage', () => {
    for (const raw of [null, '{bad json', '{}', 'null', '"hello"'])
      expect(parseSaved(raw)).toEqual([]);
  });
  test('discards invalid records and duplicate IDs and rejects unsafe image URLs', () => {
    const result = parseSaved(
      JSON.stringify([
        { id: '12', name: 'Art Lab', photo: 'https://example.com/art.avif' },
        { id: '12', name: 'Duplicate', photo: '' },
        { id: '4', name: 'Robotics', photo: 'javascript:alert(1)' },
        { id: {}, name: 'Invalid' },
        { id: 'staff', name: 'Not an activity' },
        null,
      ]),
    );
    expect(result).toEqual([
      { id: '12', name: 'Art Lab', photo: 'https://example.com/art.avif' },
      { id: '4', name: 'Robotics', photo: '' },
    ]);
  });
});
