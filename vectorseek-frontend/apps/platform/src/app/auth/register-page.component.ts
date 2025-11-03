import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { createForm } from '@colsen1996/ng-zod-form';
import type { AuthError, RegisterRequest } from '@vectorseek/data-access/lib/auth/auth.models';
import type { AuthService } from '@vectorseek/data-access/lib/auth/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { AuthI18nService } from './auth-i18n.service';
import { registerFormSchema } from './schemas/register.schema';
import { FieldErrorComponent } from './ui/field-error.component';
import { FieldErrors, mapAuthFieldErrors, mapZodError, translateFieldErrors } from './utils/error-mapper';
import { AuthFormState, INITIAL_FORM_STATE, createInitialState } from './utils/auth-form-state';
import { SimpleSubject } from './utils/simple-subject';

interface RegisterFormValue {
  fullName: string;
  email: string;
  password: string;
  acceptTerms: boolean;
}

function missingAuthService(): never {
  throw new Error('AuthService instance not provided');
}

@Component({
  selector: 'vectorseek-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FieldErrorComponent],
  template: `
    <article class="auth-page">
      <header class="auth-page__header">
        <h3>{{ text.title }}</h3>
        <p>{{ text.description }}</p>
      </header>

      <form (ngSubmit)="submit()" class="auth-form">
        <label class="auth-form__field">
          <span>{{ text.fullName }}</span>
          <input type="text" name="fullName" [value]="form.controls.fullName.value" (input)="updateControl('fullName', $event.target.value)" />
          <app-field-error [messages]="getFieldErrors('fullName')"></app-field-error>
        </label>

        <label class="auth-form__field">
          <span>{{ text.email }}</span>
          <input type="email" name="email" [value]="form.controls.email.value" (input)="updateControl('email', $event.target.value)" />
          <app-field-error [messages]="getFieldErrors('email')"></app-field-error>
        </label>

        <label class="auth-form__field">
          <span>{{ text.password }}</span>
          <input type="password" name="password" [value]="form.controls.password.value" (input)="updateControl('password', $event.target.value)" />
          <app-field-error [messages]="getFieldErrors('password')"></app-field-error>
        </label>

        <label class="auth-form__checkbox">
          <input type="checkbox" name="acceptTerms" [checked]="form.controls.acceptTerms.value" (change)="updateControl('acceptTerms', $event.target.checked)" />
          <span>{{ text.acceptTerms }}</span>
          <app-field-error [messages]="getFieldErrors('acceptTerms')"></app-field-error>
        </label>

        <ng-container *ngIf="state$ | async as vm">
          <section class="auth-form__status" *ngIf="vm.error as error">
            <p class="error-summary">{{ error.summary ?? errorSummaryFallback }}</p>
            <p class="error-description">{{ error.description ?? errorDescriptionFallback }}</p>
          </section>

          <section class="auth-form__status" *ngIf="vm.success && vm.successMessage">
            <p class="success-message">{{ vm.successMessage }}</p>
          </section>
        </ng-container>

        <button type="submit">{{ text.submit }}</button>
      </form>
    </article>
  `,
  styles: [
    `
      .auth-page { display: grid; gap: 1.5rem; }
      .auth-page__header { text-align: center; }
      .auth-form { display: grid; gap: 1rem; }
      .auth-form__field { display: grid; gap: 0.5rem; }
      .auth-form__checkbox { display: grid; gap: 0.25rem; font-size: 0.875rem; }
      .auth-form__status { background: #f8fafc; border-radius: 0.5rem; padding: 0.75rem; }
      .error-summary { color: #e53e3e; font-weight: 600; margin: 0; }
      .error-description { color: #c53030; margin: 0.25rem 0 0; }
      .success-message { color: #2f855a; font-weight: 600; margin: 0; }
      input[type='text'], input[type='email'], input[type='password'] { padding: 0.5rem; border: 1px solid #d2d6dc; border-radius: 0.375rem; }
      button { background: #2563eb; color: #fff; border: none; border-radius: 0.5rem; padding: 0.75rem 1rem; font-weight: 600; cursor: pointer; }
      button:hover { background: #1e3a8a; }
    `
  ]
})
export class RegisterPageComponent {
  readonly form: FormGroup<RegisterFormValue>;
  readonly state = new SimpleSubject<AuthFormState>(createInitialState());
  readonly state$ = this.state.asObservable();
  readonly text: Record<string, string>;

  fieldErrors: FieldErrors = {};
  readonly errorSummaryFallback: string;
  readonly errorDescriptionFallback: string;

  private readonly successMessage: string;
  private readonly formDirective: FormGroupDirective;
  private readonly zodForm = createForm(registerFormSchema);
  private readonly i18n: AuthI18nService;

  constructor(
    private readonly authService: Pick<AuthService, 'register'> = { register: () => missingAuthService() } as unknown as Pick<AuthService, 'register'>,
    private readonly translate: TranslateService = new TranslateService(),
    private readonly formBuilder: FormBuilder = new FormBuilder(),
    authI18nService?: AuthI18nService,
    formDirective?: FormGroupDirective
  ) {
    this.i18n = authI18nService ?? new AuthI18nService(this.translate);
    this.i18n.ensureLoaded();

    this.form = this.formBuilder.group<RegisterFormValue>({
      fullName: '',
      email: '',
      password: '',
      acceptTerms: false
    });

    this.formDirective = formDirective ?? new FormGroupDirective(this.form);
    this.formDirective.form = this.form;

    this.text = {
      title: this.translate.instant('auth.register.title'),
      description: this.translate.instant('auth.register.description'),
      submit: this.translate.instant('auth.register.submit'),
      fullName: this.translate.instant('auth.fields.fullName'),
      email: this.translate.instant('auth.fields.email'),
      password: this.translate.instant('auth.fields.password'),
      acceptTerms: this.translate.instant('auth.fields.acceptTerms')
    };

    this.successMessage = this.translate.instant('auth.success.register');
    this.errorSummaryFallback = this.translate.instant('auth.errors.genericSummary');
    this.errorDescriptionFallback = this.translate.instant('auth.errors.genericDescription');
  }

  submit(): void {
    const parsed = this.zodForm.safeParse(this.form.getRawValue());

    if (!parsed.success) {
      this.fieldErrors = translateFieldErrors(this.translate, mapZodError(parsed.error));
      this.state.next(createInitialState());
      return;
    }

    const payload: RegisterRequest = {
      ...parsed.data,
      acceptTerms: parsed.data.acceptTerms
    };

    this.fieldErrors = {};
    this.state.next({ ...INITIAL_FORM_STATE, loading: true });

    this.authService.register(payload).subscribe({
      next: () => {
        this.formDirective.resetForm({ fullName: '', email: '', password: '', acceptTerms: false });
        this.state.next({ loading: false, success: true, error: null, successMessage: this.successMessage });
      },
      error: (error: AuthError) => {
        this.fieldErrors = translateFieldErrors(this.translate, mapAuthFieldErrors(error));
        this.state.next({ loading: false, success: false, error, successMessage: null });
      }
    });
  }

  getFieldErrors(control: keyof RegisterFormValue): string[] {
    return this.fieldErrors[control] ?? [];
  }

  updateControl(control: keyof RegisterFormValue, value: string | boolean): void {
    const controlRef = this.form.controls[control];
    controlRef.setValue(value as never);
  }
}
