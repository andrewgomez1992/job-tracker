import {
  differenceInCalendarDays, format, formatDistanceToNowStrict, isThisYear, isToday, isTomorrow,
  isValid, isYesterday, parseISO,
} from 'date-fns';

const parse = (value) => {
  if (!value) return null;
  const date = typeof value === 'string' ? parseISO(value) : new Date(value);
  return isValid(date) ? date : null;
};

/** "Today", "Tomorrow", "12 Aug", "12 Aug 2025" */
export function formatDate(value) {
  const date = parse(value);
  if (!date) return null;
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, isThisYear(date) ? 'd MMM' : 'd MMM yyyy');
}

/** "Today at 14:30" style, for things with a real time on them. */
export function formatDateTime(value) {
  const date = parse(value);
  if (!date) return null;
  const day = formatDate(value);
  return `${day} · ${format(date, 'h:mm a')}`;
}

export function formatRelative(value) {
  const date = parse(value);
  if (!date) return null;
  if (isToday(date)) return 'today';
  return `${formatDistanceToNowStrict(date)} ${date > new Date() ? 'from now' : 'ago'}`;
}

/** Signed day delta: negative is overdue. */
export function daysUntil(value) {
  const date = parse(value);
  return date ? differenceInCalendarDays(date, new Date()) : null;
}

/** "Overdue by 2 days" / "Due today" / "In 5 days" */
export function formatDueLabel(value) {
  const days = daysUntil(value);
  if (days === null) return null;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`;
  return `In ${days} days`;
}

const compact = (n, currency) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency', currency: currency || 'USD',
    notation: 'compact', maximumFractionDigits: 0,
  }).format(n);

export function formatSalary(min, max, currency = 'USD') {
  if (min == null && max == null) return null;
  if (min != null && max != null) {
    return min === max ? compact(min, currency) : `${compact(min, currency)}–${compact(max, currency)}`;
  }
  return min != null ? `${compact(min, currency)}+` : `Up to ${compact(max, currency)}`;
}

export function formatBytes(bytes) {
  if (!bytes) return null;
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; }
  return `${value.toFixed(value < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`;
}

/** ISO string -> value for <input type="datetime-local">, in local time. */
export function toLocalInputValue(iso) {
  const date = parse(iso);
  if (!date) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

/** ISO string -> value for <input type="date">, in local time. */
export function toDateInputValue(iso) {
  const date = parse(iso);
  if (!date) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

/** Local input value -> ISO string for the API. */
export function fromInputValue(value) {
  if (!value) return null;
  const date = new Date(value);
  return isValid(date) ? date.toISOString() : null;
}

export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?';

/** Deterministic hue per company, so a logo-less avatar still feels intentional. */
export const hueFromString = (value = '') => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) % 360;
  return hash;
};

export const pluralize = (count, singular, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;
