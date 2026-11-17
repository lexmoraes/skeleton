import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { AuthTokenService, isTokenExpired } from './auth-token.service';

/** Unsigned JWT with the given `exp` (seconds from now) — enough for client-side checks. */
function fakeJwt(expiresInSeconds: number): string {
  const encode = (obj: object) => btoa(JSON.stringify(obj)).replace(/=+$/, '');
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  return `${encode({ alg: 'none' })}.${encode({ exp })}.sig`;
}

const USER = {
  id: 1,
  email: 'ana@example.com',
  username: 'ana',
  registration_number: '1',
  first_name: '',
  last_name: '',
  cellphone: null,
  is_staff: false,
};

describe('isTokenExpired', () => {
  it('treats missing, malformed and past tokens as expired', () => {
    expect(isTokenExpired(null)).toBe(true);
    expect(isTokenExpired('garbage')).toBe(true);
    expect(isTokenExpired(fakeJwt(-60))).toBe(true);
    expect(isTokenExpired(fakeJwt(3600))).toBe(false);
  });
});

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokens: AuthTokenService;
  let auth: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(AuthTokenService);
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => httpMock.verify());

  it('adds the bearer token to API calls only', () => {
    tokens.setTokens('access-1', fakeJwt(3600));
    http.get('/api/things/').subscribe();
    http.get('https://elsewhere.example/x').subscribe();

    expect(httpMock.expectOne('/api/things/').request.headers.get('Authorization')).toBe(
      'Bearer access-1',
    );
    expect(
      httpMock.expectOne('https://elsewhere.example/x').request.headers.has('Authorization'),
    ).toBe(false);
  });

  it('on 401 refreshes once, stores the rotated pair and retries every pending request', () => {
    const oldRefresh = fakeJwt(3600);
    const newRefresh = fakeJwt(7200);
    tokens.setTokens('expired-access', oldRefresh);

    const results: unknown[] = [];
    http.get('/api/a/').subscribe((r) => results.push(r));
    http.get('/api/b/').subscribe((r) => results.push(r));

    httpMock.expectOne('/api/a/').flush(null, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne('/api/b/').flush(null, { status: 401, statusText: 'Unauthorized' });

    // Both 401s share a single refresh call.
    const refresh = httpMock.expectOne(auth.refreshUrl);
    expect(refresh.request.body).toEqual({ refresh: oldRefresh });
    refresh.flush({ access: 'access-2', refresh: newRefresh });

    for (const url of ['/api/a/', '/api/b/']) {
      const retry = httpMock.expectOne(url);
      expect(retry.request.headers.get('Authorization')).toBe('Bearer access-2');
      retry.flush({ ok: url });
    }

    expect(results).toHaveLength(2);
    expect(tokens.getAccessToken()).toBe('access-2');
    expect(tokens.getRefreshToken()).toBe(newRefresh);
  });

  it('logs out and goes to /login when the refresh fails', () => {
    tokens.setTokens('expired-access', fakeJwt(3600));
    tokens.setUser(USER);
    let failed = false;
    http.get('/api/a/').subscribe({ error: () => (failed = true) });

    httpMock.expectOne('/api/a/').flush(null, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne(auth.refreshUrl).flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(failed).toBe(true);
    expect(tokens.getRefreshToken()).toBeNull();
    expect(auth.currentUser()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('never tries to refresh on a failed login', () => {
    let status = 0;
    auth.login('ana', 'wrong').subscribe({ error: (e) => (status = e.status) });
    httpMock.expectOne(auth.loginUrl).flush(null, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectNone(auth.refreshUrl);
    expect(status).toBe(401);
  });
});

describe('AuthService.isAuthenticated', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
  });

  it('requires a cached user and a refresh token that has not expired', () => {
    const tokens = TestBed.inject(AuthTokenService);
    tokens.setUser(USER);
    tokens.setTokens('expired-access', fakeJwt(-10));
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(false);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    // Access token may be expired: the interceptor renews it transparently.
    TestBed.inject(AuthTokenService).setTokens('expired-access', fakeJwt(3600));
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(true);
  });
});
