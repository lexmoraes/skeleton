/** Parses a 'yyyy-MM-dd' string into a local-time Date, avoiding the UTC-midnight
 * shift that `new Date('yyyy-MM-dd')` causes in timezones behind UTC. */
export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Formats a Date as 'yyyy-MM-dd' in local time — the inverse of parseIsoDate. */
export function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
