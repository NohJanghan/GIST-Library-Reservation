import {
  addDaysToDateKey,
  formatDateHeading,
  formatDateKeyFromDate,
  getCurrentKoreaTimeParts,
  getDateOptions,
  isDateWithinRange,
} from "../../../src/shared/lib/date";

describe("shared/lib/date", () => {
  it("formats date keys and Korea time parts from a Date", () => {
    const date = new Date("2026-04-22T01:34:00Z");

    expect(formatDateKeyFromDate(date)).toBe("20260422");
    expect(getCurrentKoreaTimeParts(date)).toEqual({ hour: 10, minute: 34 });
    expect(formatDateHeading("20260422")).toContain("4월 22일");
  });

  it("builds a date window and compares range membership", () => {
    const baseDate = new Date("2026-04-22T01:00:00Z");

    expect(getDateOptions(3, baseDate)).toEqual([
      "20260422",
      "20260423",
      "20260424",
    ]);
    expect(addDaysToDateKey("20260422", 7)).toBe("20260429");
    expect(isDateWithinRange("20260423", "20260422", "20260424")).toBe(true);
    expect(isDateWithinRange("20260425", "20260422", "20260424")).toBe(false);
  });
});
