import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { AuthTokenService } from './auth-token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStore = inject(AuthTokenService);
  const token = tokenStore.getAccessToken();

  if (token && req.url.startsWith(environment.API.BASE_URL)) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req);
};
