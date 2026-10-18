export function periodIsCurrent(end?: string | Date | null) {
  if (!end) return false;
  const time = new Date(end).getTime();
  return Number.isFinite(time) && time > Date.now();
}
