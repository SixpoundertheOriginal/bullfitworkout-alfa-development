export function formatLocalDate(utcISOString: string, timeZone: string = 'Europe/Warsaw') {
  if (!utcISOString) return '';
  try {
    return new Intl.DateTimeFormat('pl-PL', { timeZone }).format(new Date(utcISOString));
  } catch {
    return utcISOString;
  }
}
