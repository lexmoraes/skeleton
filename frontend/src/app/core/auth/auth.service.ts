import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AccountUser } from '../../shared/models/account-user.model';
import { AuthTokenService } from './auth-token.service';

export interface LoginResponse {
  access: string;
  refresh: string;
  user: AccountUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStore = inject(AuthTokenService);
  private readonly resourceUrl = `${environment.API.BASE_URL}account/`;

  private readonly _currentUser = signal<AccountUser | null>(this.tokenStore.loadUser());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUser() && !!this.tokenStore.getAccessToken());

  /** identifier accepts email, username or matrícula (registration_number). */
  login(identifier: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.resourceUrl}login/`, { identifier, password }).pipe(
      tap((res) => {
        this.tokenStore.setTokens(res.access, res.refresh);
        this.tokenStore.setUser(res.user);
        this._currentUser.set(res.user);
      }),
    );
  }

  logout(): void {
    this.tokenStore.clear();
    this._currentUser.set(null);
  }

  refreshAccessToken(): Observable<{ access: string }> {
    const refresh = this.tokenStore.getRefreshToken();
    return this.http.post<{ access: string }>(`${this.resourceUrl}login/refresh/`, { refresh }).pipe(
      tap((res) => this.tokenStore.setAccessToken(res.access)),
    );
  }
}
