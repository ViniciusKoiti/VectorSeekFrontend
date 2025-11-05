import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../libs/data-access/src/lib/auth/auth.service';
import { AuthError } from '../../../libs/data-access/src/lib/auth/auth.models';
import { FieldErrorComponent } from './components/field-error.component';
import { loginSchema, LoginFormData } from './schemas/auth.schemas';
import { zodValidator } from './utils/zod-validators';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, TranslateModule, FieldErrorComponent],
  template: `
    <section class="auth-page">
      <header>
        <h1>{{ 'auth.login.title' | translate }}</h1>
        <p>{{ 'auth.login.subtitle' | translate }}</p>
      </header>

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
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
          <label for="email">{{ 'auth.login.emailLabel' | translate }}</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            [placeholder]="'auth.login.emailPlaceholder' | translate"
            [class.invalid]="emailControl.invalid && emailControl.touched"
            autocomplete="email"
          />
          <app-field-error [control]="emailControl" fieldName="email"></app-field-error>
        </div>

        <!-- Campo Senha -->
        <div class="form-field">
          <label for="password">{{ 'auth.login.passwordLabel' | translate }}</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            [placeholder]="'auth.login.passwordPlaceholder' | translate"
            [class.invalid]="passwordControl.invalid && passwordControl.touched"
            autocomplete="current-password"
          />
          <app-field-error [control]="passwordControl" fieldName="password"></app-field-error>
        </div>

        <!-- Checkbox Lembrar -->
        <div class="form-checkbox">
          <input id="rememberMe" type="checkbox" formControlName="rememberMe" />
          <label for="rememberMe">{{ 'auth.login.rememberMeLabel' | translate }}</label>
        </div>

        <!-- Botão Submit -->
        <button type="submit" class="btn-primary" [disabled]="loginForm.invalid || isSubmitting">
          {{ isSubmitting ? ('auth.login.submittingButton' | translate) : ('auth.login.submitButton' | translate) }}
        </button>
      </form>

      <footer class="auth-footer">
        <a routerLink="/auth/register">{{ 'auth.login.registerLink' | translate }}</a>
        <a routerLink="/auth/forgot-password">{{ 'auth.login.forgotPasswordLink' | translate }}</a>
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

      .form-checkbox {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .form-checkbox input[type="checkbox"] {
        width: 1rem;
        height: 1rem;
        cursor: pointer;
      }
      .form-checkbox label {
        font-size: 0.875rem;
        color: #475569;
        cursor: pointer;
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
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
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
export class LoginPageComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  loginForm!: FormGroup;
  isSubmitting = false;
  apiError: AuthError | null = null;

  ngOnInit(): void {
    console.info('LoginPageComponent inicializado');
    this.translate.use('pt-BR');
    this.initForm();
  }

  ngOnDestroy(): void {
    console.info('LoginPageComponent destruído');
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, zodValidator(loginSchema.shape.email)]],
      password: ['', [Validators.required, zodValidator(loginSchema.shape.password)]],
      rememberMe: [false]
    });
  }

  get emailControl() {
    return this.loginForm.get('email')!;
  }

  get passwordControl() {
    return this.loginForm.get('password')!;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.apiError = null;

    const formData = this.loginForm.value as LoginFormData;

    this.authService.login(formData).subscribe({
      next: (response) => {
        console.info('Login realizado com sucesso', response);
        // TODO: Armazenar sessão no Signal Store (E1-A2)
        // this.router.navigate(['/app/dashboard']);
        alert('Login realizado com sucesso! Redirecionamento será implementado em E1-A2.');
        this.isSubmitting = false;
      },
      error: (error: AuthError) => {
        console.error('Erro no login', error);
        this.apiError = error;
        this.isSubmitting = false;
      }
    });
  }
}

