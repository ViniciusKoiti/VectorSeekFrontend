import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../libs/data-access/src/lib/auth/auth.service';
import { AuthError } from '../../../libs/data-access/src/lib/auth/auth.models';
import { FieldErrorComponent } from './components/field-error.component';
import { registerSchema, RegisterFormData } from './schemas/auth.schemas';
import { zodValidator } from './utils/zod-validators';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, TranslateModule, FieldErrorComponent],
  template: `
    <section class="auth-page">
      <header>
        <h1>{{ 'auth.register.title' | translate }}</h1>
        <p>{{ 'auth.register.subtitle' | translate }}</p>
      </header>

      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
        <!-- Mensagem de erro geral da API -->
        <div class="api-error" *ngIf="apiError">
          <span class="error-icon">⚠</span>
          <div>
            <strong>{{ apiError.summary }}</strong>
            <p *ngIf="apiError.description">{{ apiError.description }}</p>
            <ul *ngIf="apiError.fieldErrors" class="field-errors-list">
              <li *ngFor="let field of getFieldErrors()">
                <strong>{{ field.field }}:</strong> {{ field.errors.join(', ') }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Campo Nome Completo -->
        <div class="form-field">
          <label for="fullName">{{ 'auth.register.fullNameLabel' | translate }}</label>
          <input
            id="fullName"
            type="text"
            formControlName="fullName"
            [placeholder]="'auth.register.fullNamePlaceholder' | translate"
            [class.invalid]="fullNameControl.invalid && fullNameControl.touched"
            autocomplete="name"
          />
          <app-field-error [control]="fullNameControl" fieldName="fullName"></app-field-error>
        </div>

        <!-- Campo Email -->
        <div class="form-field">
          <label for="email">{{ 'auth.register.emailLabel' | translate }}</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            [placeholder]="'auth.register.emailPlaceholder' | translate"
            [class.invalid]="emailControl.invalid && emailControl.touched"
            autocomplete="email"
          />
          <app-field-error [control]="emailControl" fieldName="email"></app-field-error>
        </div>

        <!-- Campo Senha -->
        <div class="form-field">
          <label for="password">{{ 'auth.register.passwordLabel' | translate }}</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            [placeholder]="'auth.register.passwordPlaceholder' | translate"
            [class.invalid]="passwordControl.invalid && passwordControl.touched"
            autocomplete="new-password"
          />
          <app-field-error [control]="passwordControl" fieldName="password"></app-field-error>
          <div class="password-hint" *ngIf="!passwordControl.touched">
            <small>Mínimo 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais</small>
          </div>
        </div>

        <!-- Checkbox Aceitar Termos -->
        <div class="form-checkbox">
          <input id="acceptTerms" type="checkbox" formControlName="acceptTerms" />
          <label for="acceptTerms">{{ 'auth.register.acceptTermsLabel' | translate }}</label>
        </div>
        <app-field-error [control]="acceptTermsControl" fieldName="acceptTerms"></app-field-error>

        <!-- Botão Submit -->
        <button type="submit" class="btn-primary" [disabled]="registerForm.invalid || isSubmitting">
          {{ isSubmitting ? ('auth.register.submittingButton' | translate) : ('auth.register.submitButton' | translate) }}
        </button>
      </form>

      <footer class="auth-footer">
        <a routerLink="/auth/login">{{ 'auth.register.loginLink' | translate }}</a>
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
      .field-errors-list {
        margin: 0.5rem 0 0;
        padding-left: 1.25rem;
        font-size: 0.875rem;
        color: #7f1d1d;
      }
      .field-errors-list li {
        margin-bottom: 0.25rem;
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
      .password-hint {
        font-size: 0.75rem;
        color: #64748b;
        line-height: 1.25rem;
      }

      .form-checkbox {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
      }
      .form-checkbox input[type="checkbox"] {
        width: 1rem;
        height: 1rem;
        margin-top: 0.125rem;
        cursor: pointer;
        flex-shrink: 0;
      }
      .form-checkbox label {
        font-size: 0.875rem;
        color: #475569;
        cursor: pointer;
        line-height: 1.25rem;
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
export class RegisterPageComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  registerForm!: FormGroup;
  isSubmitting = false;
  apiError: AuthError | null = null;

  ngOnInit(): void {
    console.info('RegisterPageComponent inicializado');
    this.translate.use('pt-BR');
    this.initForm();
  }

  ngOnDestroy(): void {
    console.info('RegisterPageComponent destruído');
  }

  private initForm(): void {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, zodValidator(registerSchema.shape.fullName)]],
      email: ['', [Validators.required, zodValidator(registerSchema.shape.email)]],
      password: ['', [Validators.required, zodValidator(registerSchema.shape.password)]],
      acceptTerms: [false, [Validators.required, zodValidator(registerSchema.shape.acceptTerms)]]
    });
  }

  get fullNameControl() {
    return this.registerForm.get('fullName')!;
  }

  get emailControl() {
    return this.registerForm.get('email')!;
  }

  get passwordControl() {
    return this.registerForm.get('password')!;
  }

  get acceptTermsControl() {
    return this.registerForm.get('acceptTerms')!;
  }

  getFieldErrors(): Array<{ field: string; errors: string[] }> {
    if (!this.apiError || !this.apiError.fieldErrors) {
      return [];
    }

    return Object.entries(this.apiError.fieldErrors).map(([field, errors]) => ({
      field,
      errors
    }));
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.apiError = null;

    const formData = this.registerForm.value as RegisterFormData;

    this.authService.register(formData).subscribe({
      next: (response) => {
        console.info('Registro realizado com sucesso', response);
        // TODO: Armazenar sessão no Signal Store (E1-A2)
        // this.router.navigate(['/app/dashboard']);
        alert('Conta criada com sucesso! Redirecionamento será implementado em E1-A2.');
        this.isSubmitting = false;
      },
      error: (error: AuthError) => {
        console.error('Erro no registro', error);
        this.apiError = error;
        this.isSubmitting = false;
      }
    });
  }
}

