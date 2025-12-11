import { HttpInterceptorFn, HttpErrorResponse, HttpHandlerFn, HttpEvent, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from '@vectorseek/state';
import { AuthService } from '@vectorseek/data-access';
import { environment } from '../environments/environment';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take, Observable } from 'rxjs';
import { ErrorCodes } from './core/constants/error-codes';

// Mutex for refresh process
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);
  const token = authStore.tokens()?.accessToken;

  // Add token header
  if (token && req.url.startsWith(environment.apiUrl)) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error) => {
      // Check for 401 (Token Expired) or 0 (CORS/Network Error hiding 401)
      const isTokenExpired =
        (error instanceof HttpErrorResponse && error.status === 401 && (error.error?.detail === 'token_expired' || error.error?.code === ErrorCodes.AUTH_TOKEN_EXPIRED));

      // We need to check if we have a token because status 0 can happen for other reasons (server down)
      // If we have a token and get status 0, it's likely a CORS-blocked 401
      const isCorsZeroStatus =
        (error instanceof HttpErrorResponse && error.status === 0 && !!token);

      if (isTokenExpired || isCorsZeroStatus) {
        if (isCorsZeroStatus) console.warn('[AuthInterceptor] Caught Status 0 with Token - Attempting Silent Refresh (CORS Workaround)');
        return handle401Error(req, next, authService, authStore);
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(req: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService, authStore: AuthStore): Observable<HttpEvent<any>> {
  // DEBUG LOGGING
  console.log('[AuthInterceptor] handle401Error called. isRefreshing:', isRefreshing);

  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);
    const refreshToken = authStore.tokens()?.refreshToken;
    console.log('[AuthInterceptor] Found Refresh Token:', !!refreshToken); // Don't log the token itself

    if (!refreshToken) {
      console.warn('[AuthInterceptor] No refresh token available - Aborting refresh');
      isRefreshing = false;
      return throwError(() => new Error('No refresh token available'));
    }

    console.log('[AuthInterceptor] Calling AuthService.refresh...');
    return authService.refresh({ refreshToken: refreshToken }).pipe(
      switchMap((tokens) => {
        console.log('[AuthInterceptor] Refresh Successful! New Access Token received.');
        isRefreshing = false;
        // Update store with new tokens
        authStore.updateTokens(tokens);
        refreshTokenSubject.next(tokens.accessToken);

        // Retry original request with new token
        const newReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${tokens.accessToken}`
          }
        });
        return next(newReq);
      }),
      catchError((err) => {
        console.error('[AuthInterceptor] Refresh Failed:', err);
        isRefreshing = false;
        // If refresh fails, we let the error bubble up so errorInterceptor handles it (logout/redirect)
        return throwError(() => err);
      })
    );
  } else {
    // If refreshing, wait for token
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        const newReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token!}`
          }
        });
        return next(newReq);
      })
    );
  }
}
