import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { createForm } from '@colsen1996/ng-zod-form';
import type { AuthError, LoginRequest } from '@vectorseek/data-access/lib/auth/auth.models';
import type { AuthService } from '@vectorseek/data-access/lib/auth/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { AuthI18nService } from './auth-i18n.service';
import { loginFormSchema } from './schemas/login.schema';
import { FieldErrorComponent } from './ui/field-error.component';
import { FieldErrors, mapAuthFieldErrors, mapZodError, translateFieldErrors } from './utils/error-mapper';
import { SimpleSubject } from './utils/simple-subject';
import { AuthFormState, INITIAL_FORM_STATE, createInitialState } from './utils/auth-form-state';

interface LoginFormValue {
  email: string;
  password: string;
  rememberMe: boolean;
}

function missingAuthService(): never {
  throw new Error('AuthService instance not provided');
}

@Component({
  selector: 'vectorseek-login-page',
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
          <input type="checkbox" name="rememberMe" [checked]="form.controls.rememberMe.value" (change)="updateControl('rememberMe', $event.target.checked)" />
          <span>{{ text.rememberMe }}</span>
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

      <footer class="auth-page__footer">
        <a class="link" href="#forgot">{{ text.forgot }}</a>
        <a class="link" href="#register">{{ text.noAccount }}</a>
      </footer>
    </article>
  `,
  styles: [
    `
      .auth-page { display: grid; gap: 1.5rem; }
      .auth-page__header { text-align: center; }
      .auth-page__footer { display: flex; justify-content: space-between; font-size: 0.875rem; }
      .auth-form { display: grid; gap: 1rem; }
      .auth-form__field { display: grid; gap: 0.5rem; }
      .auth-form__checkbox { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; }
      .auth-form__status { background: #f8fafc; border-radius: 0.5rem; padding: 0.75rem; }
      .error-summary { color: #e53e3e; font-weight: 600; margin: 0; }
      .error-description { color: #c53030; margin: 0.25rem 0 0; }
      .success-message { color: #2f855a; font-weight: 600; margin: 0; }
      input[type='email'], input[type='password'] { padding: 0.5rem; border: 1px solid #d2d6dc; border-radius: 0.375rem; }
      button { background: #2563eb; color: #fff; border: none; border-radius: 0.5rem; padding: 0.75rem 1rem; font-weight: 600; cursor: pointer; }
      button:hover { background: #1e3a8a; }
      .link { color: #2563eb; text-decoration: none; }
    `
  ]
})
export class LoginPageComponent {
  readonly form: FormGroup<LoginFormValue>;
  readonly state = new SimpleSubject<AuthFormState>(createInitialState());
  readonly state$ = this.state.asObservable();
  readonly text: Record<string, string>;

  fieldErrors: FieldErrors = {};
  readonly errorSummaryFallback: string;
  readonly errorDescriptionFallback: string;

  private readonly successMessage: string;
  private readonly formDirective: FormGroupDirective;
  private readonly zodForm = createForm(loginFormSchema);
  private readonly i18n: AuthI18nService;

  constructor(
    private readonly authService: Pick<AuthService, 'login'> = { login: () => missingAuthService() } as unknown as Pick<AuthService, 'login'>,
    private readonly translate: TranslateService = new TranslateService(),
    private readonly formBuilder: FormBuilder = new FormBuilder(),
    authI18nService?: AuthI18nService,
    formDirective?: FormGroupDirective
  ) {
    this.i18n = authI18nService ?? new AuthI18nService(this.translate);
    this.i18n.ensureLoaded();

    this.form = this.formBuilder.group<LoginFormValue>({
      email: '',
      password: '',
      rememberMe: false
    });

    this.formDirective = formDirective ?? new FormGroupDirective(this.form);
    this.formDirective.form = this.form;

    this.text = {
      title: this.translate.instant('auth.login.title'),
      description: this.translate.instant('auth.login.description'),
      submit: this.translate.instant('auth.login.submit'),
      forgot: this.translate.instant('auth.login.forgot'),
      noAccount: this.translate.instant('auth.login.noAccount'),
      email: this.translate.instant('auth.fields.email'),
      password: this.translate.instant('auth.fields.password'),
      rememberMe: this.translate.instant('auth.fields.rememberMe')
    };

    this.successMessage = this.translate.instant('auth.success.login');
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

    const payload: LoginRequest = {
      ...parsed.data,
      rememberMe: parsed.data.rememberMe ?? false
    };

    this.fieldErrors = {};
    this.state.next({ ...INITIAL_FORM_STATE, loading: true });

    this.authService.login(payload).subscribe({
      next: () => {
        this.formDirective.resetForm({ email: '', password: '', rememberMe: payload.rememberMe });
        this.state.next({ loading: false, success: true, error: null, successMessage: this.successMessage });
      },
      error: (error: AuthError) => {
        this.fieldErrors = translateFieldErrors(this.translate, mapAuthFieldErrors(error));
        this.state.next({ loading: false, success: false, error, successMessage: null });
      }
    });
  }

  getFieldErrors(control: keyof LoginFormValue): string[] {
    return this.fieldErrors[control] ?? [];
  }

  updateControl(control: keyof LoginFormValue, value: string | boolean): void {
    const controlRef = this.form.controls[control];
    controlRef.setValue(value as never);
  }
}
