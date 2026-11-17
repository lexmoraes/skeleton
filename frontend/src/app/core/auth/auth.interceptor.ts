import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';

function withToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}

/**
 * Adds the JWT to API calls. On a 401 it refreshes the access token once
 * (shared across concurrent requests) and retries; if the refresh fails the
 * session is over, so it logs out and sends the user to /login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStore = inject(AuthTokenService);
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!req.url.startsWith(environment.API.BASE_URL)) {
    return next(req);
  }
  // The auth endpoints themselves must never trigger a refresh loop.
  if (req.url === auth.loginUrl || req.url === auth.refreshUrl) {
    return next(req);
  }

  return next(withToken(req, tokenStore.getAccessToken())).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        !tokenStore.getRefreshToken()
      ) {
        return throwError(() => error);
      }
      return auth.refreshAccessToken().pipe(
        catchError((refreshError: unknown) => {
          auth.logout();
          router.navigate(['/login']);
          return throwError(() => refreshError);
        }),
        switchMap((res) => next(withToken(req, res.access))),
      );
    }),
  );
};
