/** Shared API and URL encoding: KG1=-2, KG2=-1, KG3=0, G1–G12=1–12. */
export function isGrade(value: unknown): value is string {
  return typeof value === 'string' && /^(?:-[12]|0|[1-9]|1[0-2])$/.test(value);
}

export function gradeLabel(value: string, format: 'short' | 'full' = 'short'): string {
  const grade = Number(value);
  return grade <= 0 ? `KG${grade + 3}` : `${format === 'full' ? 'Grade ' : 'G'}${grade}`;
}

export const gradeOptions = [
  { value: 'all', label: 'All grades' },
  ...Array.from({ length: 15 }, (_, index) => {
    const value = String(12 - index);
    return { value, label: gradeLabel(value, 'full') };
  }),
];
