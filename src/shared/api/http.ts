import type { AuthState } from "../types";
import { buildUrl } from "./config";

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

type RequestOptions = {
  path: string;
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  query?: Record<string, string>;
  session?: AuthState;
};

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

function safeParsePayload(rawText: string) {
  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
}

export function isSessionExpired(session: AuthState) {
  return session.expiredAt <= Math.floor(Date.now() / 1000);
}

export async function request<T>({
  path,
  method = "GET",
  body,
  query,
  session,
}: RequestOptions) {
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
  const payload = safeParsePayload(rawText);

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
