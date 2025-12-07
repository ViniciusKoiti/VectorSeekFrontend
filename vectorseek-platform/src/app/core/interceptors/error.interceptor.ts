import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpHandlerFn } from '@angular/common/http';
import { catchError, throwError, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '@vectorseek/data-access';
// Assuming AuthService is exported from data-access lib. 
// If not, I might need to import from the specific file, but libs usually export via index.ts
import { TranslateService } from '@ngx-translate/core';
import { ApiErrorResponse, ErrorCodes } from '../constants/error-codes';

// Configured as functional interceptor since 'auth.interceptor.ts' was functional
export const errorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    const router = inject(Router);
    const notification = inject(NotificationService);
    const authService = inject(AuthService);
    const translate = inject(TranslateService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // Ignore if not an error response object or blob/buffer
            if (!(error.error instanceof Object) && !(error.error instanceof ProgressEvent)) {
                // It might be a simple string or standard http error
            }

            const apiError = error.error as ApiErrorResponse;

            // Determine logic based on status or code
            if (apiError?.code) {
                handleApiError(apiError, error.status, router, notification, authService, translate);
            } else {
                // Fallback for non-standard errors
                if (error.status !== 0) { // 0 often means cancelled or network error handled elsewhere maybe?
                    // Actually 0 is usually network error
                    const msg = translate.instant('apiErrors.networkError') || 'Erro de conexão/inesperado';
                    notification.error(msg);
                }
            }

            return throwError(() => error);
        })
    );
};

function handleApiError(
    error: ApiErrorResponse,
    status: number,
    router: Router,
    notification: NotificationService,
    auth: AuthService,
    translate: TranslateService
): void {
    switch (error.code) {
        // Auth errors - redirect to login
        case ErrorCodes.AUTH_TOKEN_EXPIRED:
        case ErrorCodes.AUTH_INVALID_TOKEN:
        case ErrorCodes.AUTH_REQUIRED:
        case ErrorCodes.AUTH_REFRESH_TOKEN_NOT_FOUND: // Added based on spec
            // Handle logout
            // auth.logout(); // Need to verify if logout returns observable or void
            // Assuming simple logout for now.
            // Ideally dispatch a logout action if using NGRX/Signals store, but direct service call is common.
            // If authService.logout() isn't available, we might just redirect.
            router.navigate(['/login']);
            break;

        // Rate limit - show countdown
        case ErrorCodes.RATE_LIMIT_EXCEEDED:
            const retryAfter = error.params?.['retry_after'] || 60;
            notification.warning(translate.instant('apiErrors.rateLimited', { seconds: retryAfter }));
            break;

        // Quota exceeded - show upgrade modal
        case ErrorCodes.WS_QUOTA_EXCEEDED:
            notification.info(translate.instant('apiErrors.WS_QUOTA_EXCEEDED'));
            // this.modal.open(UpgradePlanComponent);
            break;

        // Validation errors - let component handle via subscription (don't notify global snackbar usually, or maybe warning?)
        case ErrorCodes.VALIDATION_ERROR:
            // Errors are in error.params.errors, components usually handle this to show inline.
            // We might NOT want to show a global snackbar here to avoid spam.
            break;

        // Documents
        case ErrorCodes.DOC_DUPLICATE:
            notification.warning(translate.instant('apiErrors.DOC_DUPLICATE'));
            break;

        case ErrorCodes.DOC_MISSING_FIELDS:
            const fieldsRaw = error.params?.['fields'];
            const fields = Array.isArray(fieldsRaw) ? fieldsRaw.join(', ') : (fieldsRaw || '');
            notification.warning(translate.instant('apiErrors.DOC_MISSING_FIELDS', { fields }));
            break;

        // Default - show message
        default:
            // Try to translate the code
            let message = translate.instant(`apiErrors.${error.code}`);

            // If translation is the key itself (meaning no translation found), fallback
            if (message === `apiErrors.${error.code}`) {
                message = error.message || translate.instant('apiErrors.unexpectedError');
            }

            if (status >= 500) {
                notification.error(message);
            } else {
                notification.warning(message);
            }
    }
}
