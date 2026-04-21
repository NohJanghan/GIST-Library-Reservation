import type {
  AuthResponse,
  AuthState,
  CommonFacilityInfo,
  CreateReservationPayload,
  DeleteReservationPayload,
  FacilityResponse,
  ReservationItem,
} from "./types";
import { formatDateKeyFromDate } from "./utils/date";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(
  /\/+$/,
  "",
);
const AUTH_STORAGE_KEY = "gist-library-reservation.auth";
const USE_DEV_PROXY = import.meta.env.DEV;

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function ensureApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL is missing");
  }

  return API_BASE_URL;
}

function buildUrl(path: string, query?: Record<string, string>) {
  const url = USE_DEV_PROXY
    ? new URL(`/api${path}`, window.location.origin)
    : new URL(`${ensureApiBaseUrl()}${path}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return url;
}

function createHeaders(session?: AuthState, contentType = true) {
  const headers = new Headers();

  if (contentType) {
    headers.set("Content-Type", "application/json");
  }

  if (session) {
    headers.set("Authorization", `${session.type} ${session.accessToken}`);
  }

  return headers;
}

async function request<T>({
  path,
  method = "GET",
  body,
  query,
  session,
}: {
  path: string;
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  query?: Record<string, string>;
  session?: AuthState;
}) {
  if (session && isSessionExpired(session)) {
    throw new ApiError("Session expired", 401);
  }

  let response: Response;

  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: createHeaders(session, body !== undefined || method !== "GET"),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiError("백엔드에 연결하지 못했습니다.", 0, error);
    }

    throw error;
  }

  const rawText = await response.text();
  const payload = rawText ? JSON.parse(rawText) : null;

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
        payload !== null &&
        "message" in payload &&
        typeof payload.message === "string"
        ? payload.message
        : `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

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

export function getConfigurationError() {
  return API_BASE_URL ? null : "VITE_API_BASE_URL is missing";
}

export function isSessionExpired(session: AuthState) {
  return session.expiredAt <= Math.floor(Date.now() / 1000);
}

export function loadStoredSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as AuthState;
    return isSessionExpired(parsed) ? null : parsed;
  } catch {
    return null;
  }
}

export function saveStoredSession(session: AuthState) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function login(userId: string, userPwd: string) {
  return request<AuthResponse>({
    path: "/auth",
    method: "POST",
    body: { userId, userPwd },
  });
}

export async function getFacility(session: AuthState, date: string) {
  const payload = await request<
    FacilityResponse & {
      commonFacilityInfo?: Partial<CommonFacilityInfo> & {
        notAvailableDays?: unknown;
      };
      notAvailableDays?: unknown;
      notAvailableRoomDays?: unknown;
    }
  >({
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
  };
}

export async function getReservations(
  session: AuthState,
  fromDate: string,
  toDate: string,
) {
  return request<ReservationItem[]>({
    path: "/reservation",
    query: { fromDate, toDate },
    session,
  });
}

export async function createReservation(
  session: AuthState,
  payload: CreateReservationPayload,
) {
  return request<{ success: true }>({
    path: "/reservation",
    method: "POST",
    body: payload,
    session,
  });
}

export async function cancelReservation(
  session: AuthState,
  payload: DeleteReservationPayload,
) {
  return request<{ success: true }>({
    path: "/reservation",
    method: "DELETE",
    body: payload,
    session,
  });
}
