export const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export const THAI_DAYS_FULL = [
  'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'
];

export const THAI_DAYS_SHORT = [
  'อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'
];

/**
 * Converts CE year to Buddhist Era (พ.ศ.)
 */
export function toBuddhistYear(ceYear: number): number {
  return ceYear + 543;
}

/**
 * Formats a Date or date string to Thai display with Buddhist year
 * e.g., "19 กันยายน 2569"
 */
export function formatThaiDate(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput + 'T00:00:00') : dateInput;
  const day = d.getDate();
  const month = THAI_MONTHS_FULL[d.getMonth()];
  const bYear = toBuddhistYear(d.getFullYear());
  return `${day} ${month} พ.ศ. ${bYear}`;
}

/**
 * Formats a month and year in Thai Buddhist Era
 * e.g., "กันยายน 2569"
 */
export function formatThaiMonthYear(year: number, monthIndex: number): string {
  return `${THAI_MONTHS_FULL[monthIndex]} ${toBuddhistYear(year)}`;
}

/**
 * Formats full Thai date with day of week
 * e.g., "วันเสาร์ที่ 19 กันยายน พ.ศ. 2569"
 */
export function formatThaiLongWithDay(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput + 'T00:00:00') : dateInput;
  const dayName = THAI_DAYS_FULL[d.getDay()];
  const day = d.getDate();
  const month = THAI_MONTHS_FULL[d.getMonth()];
  const bYear = toBuddhistYear(d.getFullYear());
  return `${dayName}ที่ ${day} ${month} พ.ศ. ${bYear}`;
}

/**
 * Returns ISO date string YYYY-MM-DD
 */
export function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds days to a date string YYYY-MM-DD
 */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toISODateString(d);
}

/**
 * Checks if a given ISO date is tomorrow relative to today
 */
export function isTomorrow(isoDate: string, todayIso: string): boolean {
  return addDays(todayIso, 1) === isoDate;
}

/**
 * Helper to check whether current time is at or past 16:00
 */
export function isPastOrAt1600(date: Date = new Date()): boolean {
  const hours = date.getHours();
  return hours >= 16;
}

/**
 * Formats time range e.g. "08:30 - 11:30 น."
 */
export function formatTimeRange(start: string, end: string): string {
  if (!start && !end) return 'ตลอดวัน';
  if (!end) return `${start} น.`;
  return `${start} - ${end} น.`;
}
