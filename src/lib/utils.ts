export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function calculatePercentage(internal: number, assignment: number, exam: number): number {
  const total = internal + assignment + exam;
  const maxTotal = 20 + 20 + 80;
  return Math.round((total / maxTotal) * 100);
}

export function gradeFromPercentage(pct: number): { grade: string; color: string } {
  if (pct >= 90) return { grade: 'A+', color: 'text-emerald-600' };
  if (pct >= 80) return { grade: 'A', color: 'text-emerald-600' };
  if (pct >= 70) return { grade: 'B+', color: 'text-blue-600' };
  if (pct >= 60) return { grade: 'B', color: 'text-blue-600' };
  if (pct >= 50) return { grade: 'C', color: 'text-amber-600' };
  if (pct >= 40) return { grade: 'D', color: 'text-orange-600' };
  return { grade: 'F', color: 'text-red-600' };
}

export function attendancePercentage(
  records: { status: string }[]
): { percentage: number; present: number; absent: number; total: number } {
  const total = records.length;
  const present = records.filter((r) => r.status === 'present').length;
  const absent = total - present;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
  return { percentage, present, absent, total };
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
