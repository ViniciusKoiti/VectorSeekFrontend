import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../libs/data-access/src/lib/auth/auth.service';
import { AuthError } from '../../../libs/data-access/src/lib/auth/auth.models';
import { FieldErrorComponent } from './components/field-error.component';
import { forgotPasswordSchema, ForgotPasswordFormData } from './schemas/auth.schemas';
import { zodValidator } from './utils/zod-validators';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, TranslateModule, FieldErrorComponent],
  template: `
    <section class="auth-page">
      <header>
        <h1>{{ 'auth.forgotPassword.title' | translate }}</h1>
        <p>{{ 'auth.forgotPassword.subtitle' | translate }}</p>
      </header>

      <!-- Mensagem de sucesso -->
      <div class="success-message" *ngIf="successMessage">
        <span class="success-icon">✓</span>
        <div>
          <strong>{{ 'auth.forgotPassword.successMessage' | translate }}</strong>
          <p>{{ successMessage }}</p>
        </div>
      </div>

      <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()" class="auth-form" *ngIf="!successMessage">
        <!-- Mensagem de erro geral da API -->
        <div class="api-error" *ngIf="apiError">
          <span class="error-icon">⚠</span>
          <div>
            <strong>{{ apiError.summary }}</strong>
            <p *ngIf="apiError.description">{{ apiError.description }}</p>
            <p *ngIf="apiError.retryAfterSeconds" class="retry-info">
              {{ 'auth.apiErrors.retryAfter' | translate: { seconds: apiError.retryAfterSeconds } }}
            </p>
          </div>
        </div>

        <!-- Campo Email -->
        <div class="form-field">
          <label for="email">{{ 'auth.forgotPassword.emailLabel' | translate }}</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            [placeholder]="'auth.forgotPassword.emailPlaceholder' | translate"
            [class.invalid]="emailControl.invalid && emailControl.touched"
            autocomplete="email"
          />
          <app-field-error [control]="emailControl" fieldName="email"></app-field-error>
        </div>

        <!-- Botão Submit -->
        <button type="submit" class="btn-primary" [disabled]="forgotPasswordForm.invalid || isSubmitting">
          {{ isSubmitting ? ('auth.forgotPassword.submittingButton' | translate) : ('auth.forgotPassword.submitButton' | translate) }}
        </button>
      </form>

      <footer class="auth-footer">
        <a routerLink="/auth/login">{{ 'auth.forgotPassword.loginLink' | translate }}</a>
      </footer>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .auth-page {
        display: grid;
        gap: 1.5rem;
        padding: 2rem;
        max-width: 28rem;
        margin: 0 auto;
        border-radius: 1rem;
        background: #ffffff;
        box-shadow: 0 10px 40px rgba(15, 23, 42, 0.08);
      }
      header h1 {
        margin: 0;
        font-size: 1.875rem;
        font-weight: 700;
        color: #0f172a;
      }
      header p {
        margin: 0.5rem 0 0;
        color: #475569;
      }

      .auth-form {
        display: grid;
        gap: 1.25rem;
      }

      .success-message {
        display: flex;
        gap: 0.75rem;
        padding: 0.875rem;
        border-radius: 0.5rem;
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
      }
      .success-message .success-icon {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.5rem;
        height: 1.5rem;
        background: #22c55e;
        color: white;
        border-radius: 50%;
        font-weight: bold;
      }
      .success-message strong {
        display: block;
        color: #166534;
        font-weight: 600;
        margin-bottom: 0.25rem;
      }
      .success-message p {
        margin: 0;
        font-size: 0.875rem;
        color: #15803d;
      }

      .api-error {
        display: flex;
        gap: 0.75rem;
        padding: 0.875rem;
        border-radius: 0.5rem;
        background: #fef2f2;
        border: 1px solid #fecaca;
      }
      .api-error .error-icon {
        flex-shrink: 0;
        color: #dc2626;
        font-size: 1.25rem;
      }
      .api-error strong {
        display: block;
        color: #991b1b;
        font-weight: 600;
        margin-bottom: 0.25rem;
      }
      .api-error p {
        margin: 0;
        font-size: 0.875rem;
        color: #7f1d1d;
      }
      .api-error .retry-info {
        margin-top: 0.5rem;
        font-style: italic;
      }

      .form-field {
        display: grid;
        gap: 0.375rem;
      }
      .form-field label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #0f172a;
      }
      .form-field input {
        padding: 0.625rem 0.875rem;
        border: 1px solid #cbd5e1;
        border-radius: 0.5rem;
        font-size: 1rem;
        transition: all 0.2s;
      }
      .form-field input:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }
      .form-field input.invalid {
        border-color: #dc2626;
      }

      .btn-primary {
        padding: 0.75rem 1.5rem;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 0.5rem;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .btn-primary:hover:not(:disabled) {
        background: #1d4ed8;
      }
      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .auth-footer {
        display: flex;
        justify-content: center;
        padding-top: 0.5rem;
        border-top: 1px solid #e2e8f0;
      }
      .auth-footer a {
        font-size: 0.875rem;
        font-weight: 600;
        color: #2563eb;
        text-decoration: none;
      }
      .auth-footer a:hover {
        text-decoration: underline;
      }
    `
  ]
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);

  forgotPasswordForm!: FormGroup;
  isSubmitting = false;
  apiError: AuthError | null = null;
  successMessage: string | null = null;

  ngOnInit(): void {
    console.info('ForgotPasswordComponent inicializado');
    this.translate.use('pt-BR');
    this.initForm();
  }

  ngOnDestroy(): void {
    console.info('ForgotPasswordComponent destruído');
  }

  private initForm(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, zodValidator(forgotPasswordSchema.shape.email)]]
    });
  }

  get emailControl() {
    return this.forgotPasswordForm.get('email')!;
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.apiError = null;
    this.successMessage = null;

    const formData = this.forgotPasswordForm.value as ForgotPasswordFormData;

    this.authService.requestMagicLink(formData).subscribe({
      next: (response) => {
        console.info('Link mágico enviado com sucesso', response);
        this.successMessage = response.message;
        this.forgotPasswordForm.reset();
        this.isSubmitting = false;
      },
      error: (error: AuthError) => {
        console.error('Erro ao enviar link mágico', error);
        this.apiError = error;
        this.isSubmitting = false;
      }
    });
  }
}

