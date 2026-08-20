'use client';

const api = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const TOKEN_KEY = 'afghan-it.access-token';
const AUTH_EVENT = 'afghan-it.auth-change';
let refreshPromise: Promise<string | null> | null = null;

export function accessToken() { return sessionStorage.getItem(TOKEN_KEY); }
export function setAccessToken(token: string) { sessionStorage.setItem(TOKEN_KEY, token); window.dispatchEvent(new Event(AUTH_EVENT)); }
export function clearAccessToken() { sessionStorage.removeItem(TOKEN_KEY); window.dispatchEvent(new Event(AUTH_EVENT)); }
export function onAuthChange(update: () => void) { window.addEventListener(AUTH_EVENT, update); return () => window.removeEventListener(AUTH_EVENT, update); }

export async function authFetch(input: string, init: RequestInit = {}) {
  const request = (token: string | null) => fetch(input, { ...init, credentials: 'include', headers: { ...init.headers, ...(token ? { authorization: `Bearer ${token}` } : {}) } });
  let response = await request(accessToken());
  if (response.status !== 401) return response;
  refreshPromise ||= fetch(`${api}/auth/refresh`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: '{}' }).then(async refreshed => {
    if (!refreshed.ok) return null;
    const data = await refreshed.json() as { accessToken: string };
    setAccessToken(data.accessToken);
    return data.accessToken;
  }).finally(() => { refreshPromise = null; });
  const token = await refreshPromise;
  if (!token) { clearAccessToken(); return response; }
  response = await request(token);
  return response;
}

export async function signOut() {
  await fetch(`${api}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => undefined);
  clearAccessToken();
}
