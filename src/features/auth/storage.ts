import type { AuthState } from "../../shared/types";
import { isSessionExpired } from "../../shared/api/http";

const AUTH_STORAGE_KEY = "gist-library-reservation.auth";

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
