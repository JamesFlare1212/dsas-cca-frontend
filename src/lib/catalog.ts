import Fuse from 'fuse.js';
import { gradeLabel, isGrade } from '#lib/grades.js';
import type {
  ClubBasic,
  ClubDetail,
  Filters,
  Meeting,
  SortOrder,
  StaffMember,
} from '#lib/types.js';

export const emptyFilters: Filters = {
  category: 'all',
  academicYear: 'all',
  grade: 'all',
  leader: 'all',
};

export function readFilters(params: URLSearchParams): Filters {
  const grade = params.get('grade') || 'all';
  const leader = params.get('leader') || 'all';
  return {
    category: params.get('category') || 'all',
    academicYear: params.get('year') || 'all',
    grade: isGrade(grade) ? grade : 'all',
    leader: ['student', 'staff'].includes(leader) ? leader : 'all',
  };
}

export function filterCount(filters: Filters): number {
  return Object.values(filters).filter((value) => value !== 'all').length;
}

export function searchClubs(clubs: ClubBasic[], search: string, sort: SortOrder): ClubBasic[] {
  const query = search.trim().toLocaleLowerCase();
  const exact = query
    ? clubs.filter((club) => club.name.toLocaleLowerCase().includes(query) || club.id === query)
    : [];
  const matches = exact.length
    ? exact
    : query
      ? new Fuse(clubs, { keys: ['name', 'id'], threshold: 0.3, ignoreLocation: true })
          .search(search.trim())
          .map(({ item }) => item)
      : [...clubs];
  return matches.sort((a, b) =>
    sort === 'newest'
      ? Number(b.id) - Number(a.id)
      : sort === 'name-asc'
        ? a.name.localeCompare(b.name, 'en', { numeric: true })
        : b.name.localeCompare(a.name, 'en', { numeric: true }),
  );
}

export function searchStaff(staff: StaffMember[], search: string): StaffMember[] {
  const query = search.trim().toLocaleLowerCase();
  const exact = query
    ? staff.filter(
        (member) =>
          member.name.toLocaleLowerCase().includes(query) ||
          member.id.toLocaleLowerCase().includes(query),
      )
    : [];
  return exact.length
    ? exact
    : query
      ? new Fuse(staff, { keys: ['name', 'id'], threshold: 0.3, ignoreLocation: true })
          .search(search.trim())
          .map(({ item }) => item)
      : [...staff].sort((a, b) => a.name.localeCompare(b.name));
}

export function gradeRange(detail: ClubDetail): string {
  const { min, max } = detail.grades;
  if (!isGrade(min) || !isGrade(max) || Number(min) > Number(max)) return 'Not specified';
  return min === max ? gradeLabel(min) : `${gradeLabel(min)}–${gradeLabel(max)}`;
}

export function meetingsFor(detail: ClubDetail): Meeting[] {
  return detail.meetings?.length ? detail.meetings : [detail.meeting];
}

export function meetingDays(detail: ClubDetail): string {
  return [...new Set(meetingsFor(detail).map((meeting) => meeting.day))].join(' & ');
}

export function locationLabel(location: Meeting['location']): string {
  return (
    [location.room, location.block, location.site]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(' · ') || 'Location to be confirmed'
  );
}

export function costLabel(cost: string | null): string {
  if (!cost?.trim()) return 'Not specified';
  return /^(free|0)$/i.test(cost.trim()) ? 'Free' : cost;
}

export function initials(name: string): string {
  return name
    .replace(/^(Mr|Mrs|Ms|Miss|Dr)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}
