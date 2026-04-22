import {
  buildReservationDisplayItems,
  findFirstAvailableRoom,
  getCancelableRangeForToday,
  getMaxSelectableHours,
  getVisibleHourOptions,
  isRoomAvailableForRange,
  mergeReservationItems,
} from "../../../src/shared/lib/reservations";
import type { FacilityGroup, ReservationItem } from "../../../src/shared/types";

const group: FacilityGroup = {
  id: 5,
  name: "Small Carrels",
  floor: 2,
  fromTime: 8,
  toTime: 23,
  facilities: [
    {
      id: 219,
      groupId: 5,
      reservationByOthers: [10, 11],
      reservationByMe: [],
    },
    {
      id: 220,
      groupId: 5,
      reservationByOthers: [],
      reservationByMe: [16],
    },
  ],
};

describe("shared/lib/reservations", () => {
  it("calculates room availability and picks the first available room", () => {
    expect(isRoomAvailableForRange(group.facilities[0], group, [10, 11])).toBe(false);
    expect(isRoomAvailableForRange(group.facilities[1], group, [14, 15])).toBe(true);
    expect(findFirstAvailableRoom(group, [14, 15])?.id).toBe(219);
  });

  it("calculates the remaining selectable hours", () => {
    expect(getMaxSelectableHours(1, 10, 4, 80)).toBe(3);
    expect(getMaxSelectableHours(4, 10, 4, 80)).toBe(0);
  });

  it("shows only the minimum rows needed for future hours on today", () => {
    expect(
      getVisibleHourOptions({
        start: 8,
        end: 23,
        isToday: true,
        nextReservableHour: 22,
        columnCount: 5,
      }),
    ).toEqual([19, 20, 21, 22, 23]);

    expect(
      getVisibleHourOptions({
        start: 8,
        end: 23,
        isToday: true,
        nextReservableHour: 19,
        columnCount: 3,
      }),
    ).toEqual([18, 19, 20, 21, 22, 23]);
  });

  it("keeps the range within operating hours when filler slots run out", () => {
    expect(
      getVisibleHourOptions({
        start: 21,
        end: 23,
        isToday: true,
        nextReservableHour: 23,
        columnCount: 5,
      }),
    ).toEqual([21, 22, 23]);
  });

  it("falls back to the last row when there are no future hours today", () => {
    expect(
      getVisibleHourOptions({
        start: 8,
        end: 23,
        isToday: true,
        nextReservableHour: 24,
        columnCount: 5,
      }),
    ).toEqual([19, 20, 21, 22, 23]);
  });

  it("keeps all operating hours visible for future dates", () => {
    expect(
      getVisibleHourOptions({
        start: 8,
        end: 12,
        isToday: false,
        nextReservableHour: 11,
        columnCount: 3,
      }),
    ).toEqual([8, 9, 10, 11, 12]);
  });

  it("merges slot rows into display ranges and computes partial cancellation", () => {
    const items: ReservationItem[] = [
      {
        reservationId: 1,
        roomId: 219,
        date: "20260422",
        fromTime: 14,
        toTime: 14,
        status: 1,
      },
      {
        reservationId: 2,
        roomId: 219,
        date: "20260422",
        fromTime: 15,
        toTime: 15,
        status: 1,
      },
    ];

    expect(mergeReservationItems(items)).toEqual([
      {
        key: "20260422-219-14-14",
        roomId: 219,
        date: "20260422",
        fromTime: 14,
        toTime: 15,
        status: 1,
      },
    ]);
    expect(getCancelableRangeForToday(mergeReservationItems(items)[0], 14)).toEqual({
      fromTime: 15,
      toTime: 15,
    });
    expect(buildReservationDisplayItems(items, "20260422", 14)[0]).toMatchObject({
      fromTime: 14,
      toTime: 15,
      cancelableRange: {
        fromTime: 15,
        toTime: 15,
      },
      requiresPartialCancellationWarning: true,
    });
  });
});
