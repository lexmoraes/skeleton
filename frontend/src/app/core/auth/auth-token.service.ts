import { Injectable } from '@angular/core';

import { AccountUser } from '../../shared/models/account-user.model';

const ACCESS_KEY = 'skeleton.access_token';
const REFRESH_KEY = 'skeleton.refresh_token';
const USER_KEY = 'skeleton.user';

/** Seconds of slack so a token about to expire mid-request counts as expired. */
const EXPIRY_LEEWAY_SECONDS = 10;

/** Reads the `exp` claim (seconds since epoch) of a JWT, or null if unreadable. */
export function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const exp = JSON.parse(atob(payload)).exp;
    return typeof exp === 'number' ? exp : null;
  } catch {
    return null;
  }
}

/** True when the token is missing, malformed or past its `exp` claim. */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const exp = getTokenExpiry(token);
  return exp === null || exp - EXPIRY_LEEWAY_SECONDS <= Date.now() / 1000;
}

/** Thin localStorage wrapper for the JWT pair + cached user. */
@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  setTokens(access: string, refresh: string): void {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  }

  setUser(user: AccountUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  loadUser(): AccountUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AccountUser;
    } catch {
      return null;
    }
  }

  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
