const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(
  /\/+$/,
  "",
);

const USE_DEV_PROXY = import.meta.env.DEV;

function ensureApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL is missing");
  }

  return API_BASE_URL;
}

export function buildUrl(path: string, query?: Record<string, string>) {
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

export function getConfigurationError() {
  return API_BASE_URL ? null : "VITE_API_BASE_URL is missing";
}
