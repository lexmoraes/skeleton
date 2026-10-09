import { Injectable } from '@angular/core';

import { AccountUser } from '../../shared/models/account-user.model';

const ACCESS_KEY = 'skeleton.access_token';
const REFRESH_KEY = 'skeleton.refresh_token';
const USER_KEY = 'skeleton.user';

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

  setAccessToken(access: string): void {
    localStorage.setItem(ACCESS_KEY, access);
  }

  setUser(user: AccountUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  loadUser(): AccountUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AccountUser) : null;
  }

  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
