/** Shared date helpers. Everything in the DB is stored as an ISO-8601 string. */
export const nowIso = () => new Date().toISOString();

export const startOfDayIso = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

export const addDaysIso = (days, from = new Date()) => {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

export const daysBetween = (a, b) => {
  if (!a || !b) return null;
  const ms = new Date(b).getTime() - new Date(a).getTime();
  if (Number.isNaN(ms)) return null;
  return ms / 86_400_000;
};
