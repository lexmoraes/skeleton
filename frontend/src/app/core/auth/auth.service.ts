import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, shareReplay, tap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AccountUser } from '../../shared/models/account-user.model';
import { AuthTokenService, isTokenExpired } from './auth-token.service';

export interface LoginResponse {
  access: string;
  refresh: string;
  user: AccountUser;
}

/** simplejwt with ROTATE_REFRESH_TOKENS returns a new refresh token on every refresh. */
export interface RefreshResponse {
  access: string;
  refresh: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStore = inject(AuthTokenService);
  readonly resourceUrl = `${environment.API.BASE_URL}account/`;
  readonly loginUrl = `${this.resourceUrl}login/`;
  readonly refreshUrl = `${this.resourceUrl}login/refresh/`;

  private readonly _currentUser = signal<AccountUser | null>(this.tokenStore.loadUser());
  readonly currentUser = this._currentUser.asReadonly();

  /** In-flight refresh, shared so concurrent 401s trigger a single refresh call. */
  private refreshInFlight$: Observable<RefreshResponse> | null = null;

  /**
   * A session is usable while the refresh token is still valid: an expired
   * access token is renewed transparently by the interceptor.
   */
  isAuthenticated(): boolean {
    return !!this._currentUser() && !isTokenExpired(this.tokenStore.getRefreshToken());
  }

  /** identifier accepts email, username or matrícula (registration_number). */
  login(identifier: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.loginUrl, { identifier, password }).pipe(
      tap((res) => {
        this.tokenStore.setTokens(res.access, res.refresh);
        this.tokenStore.setUser(res.user);
        this._currentUser.set(res.user);
      }),
    );
  }

  logout(): void {
    this.refreshInFlight$ = null;
    this.tokenStore.clear();
    this._currentUser.set(null);
  }

  refreshAccessToken(): Observable<RefreshResponse> {
    const refresh = this.tokenStore.getRefreshToken();
    if (isTokenExpired(refresh)) {
      return throwError(() => new Error('Refresh token missing or expired'));
    }
    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.http.post<RefreshResponse>(this.refreshUrl, { refresh }).pipe(
        // Store both: the old refresh token is blacklisted after rotation.
        tap((res) => this.tokenStore.setTokens(res.access, res.refresh ?? refresh!)),
        finalize(() => (this.refreshInFlight$ = null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.refreshInFlight$;
  }
}
