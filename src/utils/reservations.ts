import type {
  CancelableReservationRange,
  FacilityGroup,
  FacilityRoom,
  MergedReservation,
  ReservationDisplayItem,
  ReservationItem,
} from "../types";

export function getSelectableHourRange(groups: FacilityGroup[]) {
  if (groups.length === 0) {
    return { start: 8, end: 23 };
  }

  return groups.reduce(
    (range, group) => ({
      start: Math.min(range.start, group.fromTime),
      end: Math.max(range.end, group.toTime),
    }),
    { start: Number.POSITIVE_INFINITY, end: Number.NEGATIVE_INFINITY },
  );
}

export function getMaxSelectableHours(
  reservationCountInDay: number,
  reservationCountInMonth: number,
  reservationLimitInDay: number,
  reservationLimitInMonth: number,
) {
  return Math.max(
    0,
    Math.min(
      reservationLimitInDay - reservationCountInDay,
      reservationLimitInMonth - reservationCountInMonth,
    ),
  );
}

export function isRoomAvailableForRange(
  room: FacilityRoom,
  group: FacilityGroup,
  selectedRange: [number, number],
) {
  const [fromTime, toTime] = normalizeRange(selectedRange);

  if (fromTime < group.fromTime || toTime > group.toTime) {
    return false;
  }

  for (let hour = fromTime; hour <= toTime; hour += 1) {
    if (
      room.reservationByOthers.includes(hour) ||
      room.reservationByMe.includes(hour)
    ) {
      return false;
    }
  }

  return true;
}

export function findFirstAvailableRoom(
  group: FacilityGroup,
  selectedRange: [number, number],
) {
  const rooms = [...group.facilities].sort((left, right) => left.id - right.id);
  return rooms.find((room) => isRoomAvailableForRange(room, group, selectedRange));
}

export function normalizeRange(range: [number, number]): [number, number] {
  return range[0] <= range[1] ? range : [range[1], range[0]];
}

export function mergeReservationItems(items: ReservationItem[]) {
  const sorted = [...items].sort((left, right) => {
    if (left.date !== right.date) {
      return left.date.localeCompare(right.date);
    }

    if (left.roomId !== right.roomId) {
      return left.roomId - right.roomId;
    }

    return left.fromTime - right.fromTime;
  });

  const merged: MergedReservation[] = [];

  for (const item of sorted) {
    const last = merged[merged.length - 1];

    if (
      last &&
      last.date === item.date &&
      last.roomId === item.roomId &&
      item.fromTime <= last.toTime + 1
    ) {
      last.toTime = Math.max(last.toTime, item.toTime);
      continue;
    }

    merged.push({
      key: `${item.date}-${item.roomId}-${item.fromTime}-${item.toTime}`,
      roomId: item.roomId,
      date: item.date,
      fromTime: item.fromTime,
      toTime: item.toTime,
      status: item.status,
    });
  }

  return merged;
}

export function getCancelableRangeForToday(
  item: MergedReservation,
  currentHour: number,
): CancelableReservationRange | null {
  const fromTime = Math.max(item.fromTime, currentHour + 1);

  if (fromTime > item.toTime) {
    return null;
  }

  return {
    fromTime,
    toTime: item.toTime,
  };
}

export function buildReservationDisplayItems(
  items: ReservationItem[],
  today: string,
  currentHour: number,
): ReservationDisplayItem[] {
  return mergeReservationItems(items).map((item) => {
    if (item.date !== today) {
      return {
        ...item,
        isVisible: true,
        cancelableRange: {
          fromTime: item.fromTime,
          toTime: item.toTime,
        },
        requiresPartialCancellationWarning: false,
      };
    }

    const cancelableRange = getCancelableRangeForToday(item, currentHour);

    return {
      ...item,
      isVisible: item.toTime >= currentHour,
      cancelableRange,
      requiresPartialCancellationWarning:
        cancelableRange !== null &&
        (cancelableRange.fromTime !== item.fromTime ||
          cancelableRange.toTime !== item.toTime),
    };
  });
}
