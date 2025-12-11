import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthStore } from '../../../libs/state/src/lib/auth/auth.store';
import { AuthService } from '../../../libs/data-access/src/lib/auth/auth.service';
import {
  GoogleOAuthCallbackRequest,
  GoogleOAuthCallbackResponse,
  AuthError
} from '../../../libs/data-access/src/lib/auth/auth.models';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="oauth-callback-container">
      <div class="callback-content">
        
        <!-- Loading State -->
        <div class="callback-state" *ngIf="isProcessing">
          <div class="loading-spinner">
            <div class="spinner"></div>
          </div>
          <h2>{{ 'auth.oauth.processing_title' | translate }}</h2>
          <p>{{ 'auth.oauth.processing_message' | translate }}</p>
        </div>

        <!-- Success State -->
        <div class="callback-state success" *ngIf="isSuccess">
          <div class="success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#10b981" stroke-width="2"/>
              <path d="M8 12l3 3 5-5" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2>{{ 'auth.oauth.success_title' | translate }}</h2>
          <p>{{ 'auth.oauth.success_message' | translate }}</p>
        </div>

        <!-- Error State -->
        <div class="callback-state error" *ngIf="error">
          <div class="error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#ef4444" stroke-width="2"/>
              <path d="M15 9l-6 6m0-6l6 6" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <h2>{{ 'auth.oauth.error_title' | translate }}</h2>
          <p>{{ getErrorMessage() }}</p>
          
          <div class="error-actions">
            <button class="btn-secondary" (click)="retryAuth()">
              {{ 'auth.oauth.retry_button' | translate }}
            </button>
            <button class="btn-primary" (click)="goToLogin()">
              {{ 'auth.oauth.back_to_login' | translate }}
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .oauth-callback-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: var(--background-base);
    }

    .callback-content {
      max-width: 400px;
      width: 100%;
      text-align: center;
    }

    .callback-state {
      background: var(--background-elevated);
      border: 1px solid var(--accent-primary-border);
      border-radius: 16px;
      padding: 3rem 2rem;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    .callback-state.success {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.05);
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.1);
    }

    .callback-state.error {
      border-color: #ef4444;
      background: rgba(239, 68, 68, 0.05);
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.1);
    }

    .loading-spinner {
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: center;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top: 3px solid var(--accent-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .success-icon,
    .error-icon {
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: center;
    }

    h2 {
      margin: 0 0 1rem 0;
      color: var(--text-primary);
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    p {
      margin: 0 0 2rem 0;
      color: var(--text-secondary);
      line-height: 1.6;
      font-size: 0.95rem;
    }

    .error-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn-primary,
    .btn-secondary {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      font-size: 0.9rem;
    }

    .btn-primary {
      background: var(--accent-primary);
      color: var(--accent-primary-darker);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px var(--accent-primary-glow);
    }

    .btn-secondary {
      background: transparent;
      color: var(--text-primary);
      border: 1px solid var(--accent-primary-border);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: var(--text-primary);
    }
  `]
})
export class OAuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authStore = inject(AuthStore);
  private authService = inject(AuthService);

  isProcessing = true;
  isSuccess = false;
  error: string | null = null;

  ngOnInit(): void {
    this.handleOAuthCallback();
  }

  private handleOAuthCallback(): void {
    this.isProcessing = true;

    const urlParams = this.route.snapshot.queryParams;
    const { code, state, error: oauthError } = urlParams;

    if (oauthError) {
      this.handleError(`OAUTH_PROVIDER_ERROR_${oauthError.toUpperCase()}`);
      return;
    }

    if (!code) {
      this.handleError('OAUTH_MISSING_CODE');
      return;
    }

    if (!state) {
      this.handleError('OAUTH_MISSING_STATE');
      return;
    }

    const storedState = sessionStorage.getItem('oauth_state');
    const redirectUri = `${window.location.origin}/auth/oauth/google/callback`;

    const request: GoogleOAuthCallbackRequest = {
      code,
      state,
      expected_state: storedState || undefined,
      redirect_uri: redirectUri
    };

    // Limpar state usado
    sessionStorage.removeItem('oauth_state');

    this.authService.googleOAuthCallback(request).subscribe({
      next: (authData: GoogleOAuthCallbackResponse) => {
        this.authStore.setSession({ raw: authData });

        this.authService.me().subscribe({
          next: (user) => {
            this.authStore.setUser(user);
            this.isProcessing = false;
            this.isSuccess = true;

            setTimeout(() => {
              this.router.navigate(['/app/qna']);
            }, 2000);
          },
          error: (error: AuthError) => {
            console.error('Failed to fetch user profile:', error);
            this.handleError('OAUTH_PROFILE_ERROR');
          }
        });
      },
      error: (error: AuthError) => {
        console.error('OAuth callback error:', error);
        this.handleError(error.code || 'OAUTH_UNKNOWN_ERROR');
      }
    });
  }

  private handleError(errorCode: string): void {
    this.isProcessing = false;
    this.error = errorCode;
  }

  getErrorMessage(): string {
    if (!this.error) return '';

    const errorMap: Record<string, string> = {
      'OAUTH_PROVIDER_ERROR_ACCESS_DENIED': 'auth.oauth.error.access_denied',
      'OAUTH_PROVIDER_ERROR_INVALID_REQUEST': 'auth.oauth.error.invalid_request',
      'OAUTH_MISSING_CODE': 'auth.oauth.error.missing_code',
      'OAUTH_MISSING_STATE': 'auth.oauth.error.missing_state',
      'OAUTH_PROFILE_ERROR': 'auth.oauth.error.profile_error',
      'OAUTH_INVALID_REQUEST': 'auth.oauth.error.invalid_request',
      'OAUTH_INVALID_CREDENTIALS': 'auth.oauth.error.invalid_credentials',
      'OAUTH_ACCESS_DENIED': 'auth.oauth.error.access_denied',
      'OAUTH_RATE_LIMITED': 'auth.oauth.error.rate_limited',
      'OAUTH_SERVER_ERROR': 'auth.oauth.error.server_error',
      'OAUTH_NETWORK_ERROR': 'auth.oauth.error.network_error',
      'OAUTH_UNKNOWN_ERROR': 'auth.oauth.error.unknown'
    };

    return errorMap[this.error] || 'auth.oauth.error.unknown';
  }

  retryAuth(): void {
    // Tentar novamente redirecionando para login
    this.router.navigate(['/auth/login']);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}