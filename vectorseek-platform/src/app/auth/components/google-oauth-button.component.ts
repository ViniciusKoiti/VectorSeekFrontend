import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError } from 'rxjs';

import { AuthService } from '../../../../libs/data-access/src/lib/auth/auth.service';
import { AuthStore } from '../../../../libs/state/src/lib/auth/auth.store';
import {
  GoogleOAuthAuthorizeResponse,
  AuthError
} from '../../../../libs/data-access/src/lib/auth/auth.models';

@Component({
  selector: 'app-google-oauth-button',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <button
      type="button"
      class="google-oauth-button"
      (click)="signInWithGoogle()"
      [disabled]="isLoading"
      [attr.aria-label]="'auth.google.aria_label' | translate"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        class="google-icon"
        *ngIf="!isLoading"
        aria-hidden="true"
      >
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      
      <div class="loading-spinner" *ngIf="isLoading" aria-hidden="true">
        <div class="spinner"></div>
      </div>

      <span class="button-text">
        {{ isLoading ? ('auth.google.signing_in' | translate) : ('auth.google.sign_in' | translate) }}
      </span>
    </button>

    <div class="error-message" *ngIf="error" role="alert">
      <span class="error-icon" aria-hidden="true">⚠</span>
      {{ getErrorMessage() }}
    </div>
  `,
  styles: [`
    .google-oauth-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      padding: 12px 16px;
      background: #fff;
      border: 1px solid #dadce0;
      border-radius: 8px;
      color: #3c4043;
      font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      min-height: 48px;
      position: relative;
      overflow: hidden;
      
      &:hover:not(:disabled) {
        box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
        border-color: #c8c9ca;
        transform: translateY(-1px);
      }

      &:focus-visible {
        outline: 2px solid #4285f4;
        outline-offset: 2px;
      }

      &:active:not(:disabled) {
        transform: translateY(0);
        box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3);
      }

      &:disabled {
        background: #f8f9fa;
        color: #5f6368;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
        border-color: #dadce0;
      }
    }

    .google-icon {
      flex-shrink: 0;
      transition: transform 0.2s ease;
    }

    .google-oauth-button:hover:not(:disabled) .google-icon {
      transform: scale(1.05);
    }

    .loading-spinner {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #4285f4;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .button-text {
      white-space: nowrap;
      font-weight: 500;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 12px 16px;
      background: #fef7f0;
      border: 1px solid #fad2af;
      border-radius: 8px;
      color: #b85450;
      font-size: 13px;
      line-height: 1.4;
    }

    .error-icon {
      color: #ea4335;
      font-weight: bold;
      flex-shrink: 0;
    }

    /* Dark mode support */
    [data-theme="dark"] .google-oauth-button {
      background: #2d2d2d;
      border-color: #5f6368;
      color: #e8eaed;
    }

    [data-theme="dark"] .google-oauth-button:hover:not(:disabled) {
      background: #353535;
      border-color: #6f7378;
    }

    [data-theme="dark"] .google-oauth-button:disabled {
      background: #1a1a1a;
      color: #5f6368;
    }

    [data-theme="dark"] .error-message {
      background: #3c2415;
      border-color: #5d4037;
      color: #f28b82;
    }

    [data-theme="dark"] .spinner {
      border-color: #444;
      border-top-color: #4285f4;
    }
  `]
})
export class GoogleOAuthButtonComponent {
  private authService = inject(AuthService);
  private authStore = inject(AuthStore);
  private router = inject(Router);

  @Output() authError = new EventEmitter<AuthError>();
  @Output() authStarted = new EventEmitter<void>();

  isLoading = false;
  error: AuthError | null = null;

  signInWithGoogle(): void {
    this.isLoading = true;
    this.error = null;
    this.authStarted.emit();

    const redirectUri = this.buildRedirectUri();
    const request = {
      redirect_uri: redirectUri,
      scope: 'openid email profile'
    };

    this.authService.googleOAuthAuthorize(request).subscribe({
      next: (authData: GoogleOAuthAuthorizeResponse) => {
        if (!authData?.authorization_url) {
          throw new Error('OAUTH_URL_INVALID');
        }
        this.redirectToGoogle(authData.authorization_url);
      },
      error: (error: HttpErrorResponse) => {
        this.handleAuthError(this.mapHttpError(error));
      }
    });
  }


  private buildRedirectUri(): string {
    // URL dinâmica baseada na origem atual (browser)
    return `${window.location.origin}/auth/oauth/google/callback`;
  }

  private redirectToGoogle(authUrl: string): void {
    try {
      // Validar URL antes de redirecionar
      const url = new URL(authUrl);

      console.log('Redirecting to Google OAuth URL:', url.toString());

      if (!url.hostname.includes('accounts.google.com')) {
        throw new Error('OAUTH_URL_INVALID');
      }

      // Redirecionar de forma segura
      window.location.assign(authUrl);

    } catch (err) {
      throw new Error('OAUTH_REDIRECT_FAILED');
    }
  }

  private mapHttpError(error: HttpErrorResponse): AuthError {
    return {
      status: error.status,
      code: error.error?.code || `http_${error.status}`,
      summary: this.getErrorMessageForStatus(error.status),
      description: error.error?.message
    };
  }

  private getErrorMessageForStatus(status: number): string {
    switch (status) {
      case 400:
        return 'OAUTH_REQUEST_INVALID';
      case 401:
        return 'OAUTH_UNAUTHORIZED';
      case 403:
        return 'OAUTH_FORBIDDEN';
      case 429:
        return 'OAUTH_RATE_LIMITED';
      case 500:
      case 502:
      case 503:
        return 'OAUTH_SERVER_ERROR';
      default:
        return 'OAUTH_NETWORK_ERROR';
    }
  }

  private handleAuthError(authError: AuthError): void {
    this.error = authError;
    this.isLoading = false;
    this.authError.emit(authError);

    console.error('Google OAuth error:', authError);
  }

  getErrorMessage(): string {
    if (!this.error) return '';

    const errorMap: Record<string, string> = {
      'OAUTH_URL_INVALID': 'auth.google.error.invalid_url',
      'OAUTH_REDIRECT_FAILED': 'auth.google.error.redirect_failed',
      'OAUTH_REQUEST_INVALID': 'auth.google.error.request_invalid',
      'OAUTH_UNAUTHORIZED': 'auth.google.error.unauthorized',
      'OAUTH_FORBIDDEN': 'auth.google.error.forbidden',
      'OAUTH_RATE_LIMITED': 'auth.google.error.rate_limited',
      'OAUTH_SERVER_ERROR': 'auth.google.error.server_error',
      'OAUTH_NETWORK_ERROR': 'auth.google.error.network_error',
      'OAUTH_UNKNOWN_ERROR': 'auth.google.error.unknown'
    };

    return errorMap[this.error.summary] || 'auth.google.error.unknown';
  }
}
