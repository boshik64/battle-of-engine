export function formatTrips(count: number): string {
  const n = Math.trunc(count);
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  let word = "поездок";
  if (abs < 11 || abs > 14) {
    if (last === 1) word = "поездка";
    else if (last >= 2 && last <= 4) word = "поездки";
  }
  const formatted = new Intl.NumberFormat("ru-RU")
    .format(n)
    .replace(/[\u00A0\u202F]/g, " ");
  return `${formatted} ${word}`;
}
