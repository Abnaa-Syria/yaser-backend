/** Public-facing enrollment number (display override or real purchase count). */
export function resolvePublicEnrollmentCount(course: {
  useDisplayEnrollmentCount?: boolean | null;
  displayEnrollmentCount?: number | null;
  _count?: { purchases?: number } | null;
  purchaseCount?: number | null;
}): number {
  if (course.useDisplayEnrollmentCount === true && course.displayEnrollmentCount != null) {
    const n = Number(course.displayEnrollmentCount);
    if (Number.isFinite(n) && n >= 0) return Math.floor(n);
  }
  return Number(course._count?.purchases ?? course.purchaseCount ?? 0) || 0;
}
