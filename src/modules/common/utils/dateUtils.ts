import { format } from 'date-fns';

export function formatEventDate(dateStr: string, fmt: string): string {
  const date = new Date(dateStr);
  const finalFormat = `${fmt} yyyy`;
  return format(date, finalFormat);
}
