const KOREA_TIME_ZONE = "Asia/Seoul";

type DateParts = {
  year: number;
  month: number;
  day: number;
};

export type KoreaTimeParts = {
  hour: number;
  minute: number;
};

function getFormatter() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KOREA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getPartValue(parts: Intl.DateTimeFormatPart[], type: string) {
  const part = parts.find((item) => item.type === type);
  if (!part) {
    throw new Error(`Missing ${type} date part`);
  }

  return Number(part.value);
}

export function getTodayDateKey() {
  return formatDateKeyFromDate(new Date());
}

export function formatDateKeyFromDate(date: Date) {
  const parts = getFormatter().formatToParts(date);
  const year = getPartValue(parts, "year");
  const month = getPartValue(parts, "month");
  const day = getPartValue(parts, "day");

  return `${year}${String(month).padStart(2, "0")}${String(day).padStart(
    2,
    "0",
  )}`;
}

export function parseDateKey(dateKey: string): DateParts {
  return {
    year: Number(dateKey.slice(0, 4)),
    month: Number(dateKey.slice(4, 6)),
    day: Number(dateKey.slice(6, 8)),
  };
}

function dateKeyToUtcDate(dateKey: string) {
  const { year, month, day } = parseDateKey(dateKey);
  return new Date(Date.UTC(year, month - 1, day));
}

function utcDateToDateKey(date: Date) {
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const next = dateKeyToUtcDate(dateKey);
  next.setUTCDate(next.getUTCDate() + days);
  return utcDateToDateKey(next);
}

export function dateKeyToInputValue(dateKey: string) {
  return `${dateKey.slice(0, 4)}-${dateKey.slice(4, 6)}-${dateKey.slice(6, 8)}`;
}

export function inputValueToDateKey(inputValue: string) {
  return inputValue.split("-").join("");
}

export function compareDateKeys(left: string, right: string) {
  return left.localeCompare(right);
}

export function getDateOptions(days: number) {
  const today = getTodayDateKey();

  return Array.from({ length: days }, (_, index) => addDaysToDateKey(today, index));
}

export function getCurrentKoreaTimeParts(): KoreaTimeParts {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: KOREA_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  return {
    hour: getPartValue(parts, "hour"),
    minute: getPartValue(parts, "minute"),
  };
}

export function getNextReservableHour() {
  return getCurrentKoreaTimeParts().hour + 1;
}

export function getKoreanWeekday(dateKey: string) {
  const date = dateKeyToUtcDate(dateKey);

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KOREA_TIME_ZONE,
    weekday: "short",
  }).format(date);
}

export function formatDateLabel(dateKey: string) {
  const { month, day } = parseDateKey(dateKey);
  return `${month}월 ${day}일`;
}

export function formatDateHeading(dateKey: string) {
  return `${formatDateLabel(dateKey)} (${getKoreanWeekday(dateKey)})`;
}

export function formatHourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function formatRangeLabel(fromTime: number, toTime: number) {
  return `${formatHourLabel(fromTime)} - ${formatHourLabel(toTime + 1)}`;
}

export function isToday(dateKey: string) {
  return getTodayDateKey() === dateKey;
}

export function isDateWithinRange(
  target: string,
  fromInclusive: string,
  toInclusive: string,
) {
  return compareDateKeys(target, fromInclusive) >= 0 &&
    compareDateKeys(target, toInclusive) <= 0;
}
