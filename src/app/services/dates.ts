/**
 * The current day in the format a date input and the database column use.
 * @returns Today as YYYY-MM-DD in the local time zone.
 */
export function todayIso(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Whether an end date lies before today.
 * @param endsAt End date of a survey, or null when it runs without one.
 * @returns True when the day of the end date is already over.
 */
export function isPastDay(endsAt: string | null | undefined): boolean {
  if (!endsAt) return false;
  return endsAt.slice(0, 10) < todayIso();
}
