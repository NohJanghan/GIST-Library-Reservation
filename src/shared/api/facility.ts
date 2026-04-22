import type { AuthState, CommonFacilityInfo, FacilityResponse } from "../types";
import { formatDateKeyFromDate } from "../lib/date";
import { request } from "./http";

function normalizeBlockedDates(notAvailableDays: unknown) {
  if (!Array.isArray(notAvailableDays)) {
    return [];
  }

  const normalized = new Set<string>();

  for (const item of notAvailableDays) {
    if (typeof item === "string" && /^\d{8}$/.test(item)) {
      normalized.add(item);
      continue;
    }

    if (typeof item === "number") {
      normalized.add(formatDateKeyFromDate(new Date(item)));
      continue;
    }

    if (item && typeof item === "object") {
      const offDate = "OFF_DT" in item ? item.OFF_DT : undefined;

      if (typeof offDate === "number") {
        normalized.add(formatDateKeyFromDate(new Date(offDate)));
      }
    }
  }

  return [...normalized].sort();
}

type FacilityPayload = FacilityResponse & {
  commonFacilityInfo?: Partial<CommonFacilityInfo> & {
    notAvailableDays?: unknown;
  };
  notAvailableDays?: unknown;
  notAvailableRoomDays?: unknown;
};

export async function getFacility(session: AuthState, date: string) {
  const payload = await request<FacilityPayload>({
    path: "/facility",
    query: { date },
    session,
  });

  const blockedDatesSource =
    payload.commonFacilityInfo?.notAvailableDays ??
    payload.notAvailableDays ??
    payload.notAvailableRoomDays;

  return {
    ...payload,
    commonFacilityInfo: {
      ...payload.commonFacilityInfo,
      reservationCountInDay:
        payload.commonFacilityInfo?.reservationCountInDay ?? 0,
      reservationCountInMonth:
        payload.commonFacilityInfo?.reservationCountInMonth ?? 0,
      reservationLimitInDay:
        payload.commonFacilityInfo?.reservationLimitInDay ?? 0,
      reservationLimitInMonth:
        payload.commonFacilityInfo?.reservationLimitInMonth ?? 0,
      notAvailableDays: normalizeBlockedDates(blockedDatesSource),
    },
  } satisfies FacilityResponse;
}
