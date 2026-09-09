const DOW = ["zo", "ma", "di", "wo", "do", "vr", "za"];
const MON = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

export const eur = (n: number) => "€ " + n.toFixed(2).replace(".", ",");
export const hhmm = (t: string) => t.slice(0, 5);

export function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function today() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
export function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

export function fmtDate(iso: string, long = false) {
  const d = new Date(iso + "T00:00");
  return long
    ? `${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`
    : `${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`;
}
export { DOW, MON };

export function hoursLeft(deadlineIso: string) {
  return (new Date(deadlineIso).getTime() - Date.now()) / 3600e3;
}
