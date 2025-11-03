import { FormBuilder, FormGroupDirective } from '@angular/forms';
import type { AuthError, LoginRequest, RegisterRequest, RequestMagicLinkRequest } from '@vectorseek/data-access/lib/auth/auth.models';
import { TranslateService } from '@ngx-translate/core';
import { AuthI18nService } from './auth-i18n.service';
import { ForgotPasswordComponent } from './forgot-password.component';
import { LoginPageComponent } from './login-page.component';
import { RegisterPageComponent } from './register-page.component';
import type { AuthFormState } from './utils/auth-form-state';

interface Observer<T> {
  next?(value: T): void;
  error?(error: unknown): void;
}

function createSuccessObservable<T>(value: T) {
  return {
    subscribe(observer: Observer<T>) {
      observer?.next?.(value);
      return { unsubscribe() {} };
    }
  };
}

function createErrorObservable(error: unknown) {
  return {
    subscribe(observer: Observer<never>) {
      observer?.error?.(error);
      return { unsubscribe() {} };
    }
  };
}

describe('Auth page components', () => {
  let formBuilder: FormBuilder;

  beforeEach(() => {
    formBuilder = new FormBuilder();
  });

  describe('LoginPageComponent', () => {
    it('exposes translated labels from the auth namespace', () => {
      const translate = new TranslateService();
      const authI18n = new AuthI18nService(translate);
      const component = new LoginPageComponent(
        { login: (payload: LoginRequest) => createSuccessObservable(payload) },
        translate,
        formBuilder,
        authI18n,
        new FormGroupDirective()
      );

      expect(component.text.title).toBe('Acesse sua conta');
      expect(component.text.submit).toBe('Entrar');
    });

    it('validates email and password with translated messages', () => {
      const translate = new TranslateService();
      const authI18n = new AuthI18nService(translate);
      const component = new LoginPageComponent(
        { login: () => createSuccessObservable(null) },
        translate,
        formBuilder,
        authI18n,
        new FormGroupDirective()
      );

      component.updateControl('email', 'invalid');
      component.updateControl('password', 'short');
      component.submit();

      expect(component.getFieldErrors('email')[0]).toBe('Informe um endereço de e-mail válido.');
      expect(component.getFieldErrors('password')[0]).toBe('A senha deve conter ao menos 8 caracteres.');
    });

    it('surfaces API field errors when login fails', () => {
      const translate = new TranslateService();
      const authI18n = new AuthI18nService(translate);
      const apiError: AuthError = {
        status: 422,
        code: 'VALIDATION',
        summary: 'Erro',
        description: 'Dados inválidos',
        fieldErrors: { password: ['Senha fraca'] }
      };
      const component = new LoginPageComponent(
        { login: () => createErrorObservable(apiError) },
        translate,
        formBuilder,
        authI18n,
        new FormGroupDirective()
      );

      component.updateControl('email', 'john@example.com');
      component.updateControl('password', 'SenhaForte123');
      component.submit();

      expect(component.getFieldErrors('password')[0]).toBe('Senha fraca');
    });

    it('emits a success state when login succeeds', () => {
      const translate = new TranslateService();
      const authI18n = new AuthI18nService(translate);
      const component = new LoginPageComponent(
        { login: () => createSuccessObservable(null) },
        translate,
        formBuilder,
        authI18n,
        new FormGroupDirective()
      );

      let captured: AuthFormState | null = null;
      component.state$.subscribe((state) => {
        captured = state;
      });

      component.updateControl('email', 'john@example.com');
      component.updateControl('password', 'SenhaForte123');
      component.submit();

      expect(captured?.success).toBe(true);
      expect(captured?.successMessage).toBe('Login realizado com sucesso.');
    });
  });

  describe('RegisterPageComponent', () => {
    it('validates required fields and acceptance terms', () => {
      const translate = new TranslateService();
      const authI18n = new AuthI18nService(translate);
      const component = new RegisterPageComponent(
        { register: () => createSuccessObservable(null) },
        translate,
        formBuilder,
        authI18n,
        new FormGroupDirective()
      );

      component.updateControl('fullName', '');
      component.updateControl('email', 'user@example.com');
      component.updateControl('password', '123');
      component.updateControl('acceptTerms', false);
      component.submit();

      expect(component.getFieldErrors('fullName')[0]).toBe('Informe seu nome completo.');
      expect(component.getFieldErrors('password')[0]).toBe('A senha deve conter ao menos 8 caracteres.');
      expect(component.getFieldErrors('acceptTerms')[0]).toBe('É necessário aceitar os termos de uso para continuar.');
    });

    it('maps server validation errors to translated fields', () => {
      const translate = new TranslateService();
      const authI18n = new AuthI18nService(translate);
      const apiError: AuthError = {
        status: 422,
        code: 'VALIDATION',
        summary: 'Erro',
        description: 'Dados inválidos',
        fieldErrors: { email: ['E-mail já utilizado.'] }
      };
      const component = new RegisterPageComponent(
        { register: () => createErrorObservable(apiError) },
        translate,
        formBuilder,
        authI18n,
        new FormGroupDirective()
      );

      component.updateControl('fullName', 'John Connor');
      component.updateControl('email', 'john@example.com');
      component.updateControl('password', 'SenhaForte123');
      component.updateControl('acceptTerms', true);
      component.submit();

      expect(component.getFieldErrors('email')[0]).toBe('E-mail já utilizado.');
    });

    it('emits a success message when registration completes', () => {
      const translate = new TranslateService();
      const authI18n = new AuthI18nService(translate);
      const component = new RegisterPageComponent(
        { register: () => createSuccessObservable(null) },
        translate,
        formBuilder,
        authI18n,
        new FormGroupDirective()
      );

      let captured: AuthFormState | null = null;
      component.state$.subscribe((state) => {
        captured = state;
      });

      component.updateControl('fullName', 'John Connor');
      component.updateControl('email', 'john@example.com');
      component.updateControl('password', 'SenhaForte123');
      component.updateControl('acceptTerms', true);
      component.submit();

      expect(captured?.success).toBe(true);
      expect(captured?.successMessage).toBe('Cadastro concluído. Bem-vindo ao VectorSeek!');
    });
  });

  describe('ForgotPasswordComponent', () => {
    it('validates email input and shows translated feedback', () => {
      const translate = new TranslateService();
      const authI18n = new AuthI18nService(translate);
      const component = new ForgotPasswordComponent(
        { requestMagicLink: () => createSuccessObservable(null) },
        translate,
        formBuilder,
        authI18n,
        new FormGroupDirective()
      );

      component.updateControl('email', 'invalid');
      component.submit();

      expect(component.getFieldErrors('email')[0]).toBe('Informe um endereço de e-mail válido.');
    });

    it('emits success state when the recovery email is sent', () => {
      const translate = new TranslateService();
      const authI18n = new AuthI18nService(translate);
      const component = new ForgotPasswordComponent(
        { requestMagicLink: () => createSuccessObservable<RequestMagicLinkRequest | null>(null) },
        translate,
        formBuilder,
        authI18n,
        new FormGroupDirective()
      );

      let captured: AuthFormState | null = null;
      component.state$.subscribe((state) => {
        captured = state;
      });

      component.updateControl('email', 'john@example.com');
      component.submit();

      expect(captured?.success).toBe(true);
      expect(captured?.successMessage).toBe('Enviamos instruções para o seu e-mail. Confira sua caixa de entrada.');
    });
  });
});
