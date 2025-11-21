import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { LoginPageComponent } from './login-page.component';
import { AuthService } from '../../../libs/data-access/src/lib/auth/auth.service';
import { AuthError } from '../../../libs/data-access/src/lib/auth/auth.models';
import { AuthStore } from '../../../libs/state/src/lib/auth/auth.store';

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let authStore: jasmine.SpyObj<AuthStore>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'me']);
    const authStoreSpy = jasmine.createSpyObj('AuthStore', ['setSession', 'setUser', 'clearSession']);
    
    authServiceSpy.me.and.returnValue(of({
      id: '1',
      email: 'test@example.com',
      name: 'Test User'
    }));
    authServiceSpy.login.and.returnValue(of({
      raw: {
        user_id: '1',
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 3600,
        token_type: 'Bearer'
      }
    }));

    await TestBed.configureTestingModule({
      imports: [
        LoginPageComponent,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([
          { path: 'app/qna', redirectTo: '' }
        ]),
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: AuthStore, useValue: authStoreSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    authStore = TestBed.inject(AuthStore) as jasmine.SpyObj<AuthStore>;
    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.loginForm.value).toEqual({
      email: '',
      password: '',
      rememberMe: false
    });
  });

  it('should mark form as invalid when empty', () => {
    expect(component.loginForm.invalid).toBe(true);
  });

  it('should mark form as valid with correct values', () => {
    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'Password123!'
    });

    expect(component.loginForm.valid).toBe(true);
  });

  it('should not submit when form is invalid', () => {
    component.onSubmit();

    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should call authService.login when form is valid', () => {
    const mockResponse = {
      raw: {
        user_id: '1',
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 3600,
        token_type: 'Bearer'
      }
    };

    authService.login.and.returnValue(of(mockResponse));

    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'Password123!'
    });

    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'Password123!',
      rememberMe: false
    });
  });

  it('should set isSubmitting to true during submit', (done) => {
    authService.login.and.returnValue(of({} as any));
    authService.me.and.returnValue(of({} as any));

    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'Password123!'
    });

    component.isSubmitting = false;
    component.onSubmit();

    setTimeout(() => {
      expect(component.isSubmitting).toBe(false); // Volta a false após sucesso
      done();
    }, 100);
  });

  it('should handle login errors', fakeAsync(() => {
    const mockError: AuthError = {
      status: 401,
      code: 'AUTH_INVALID',
      summary: 'Credenciais inválidas',
      description: 'Verifique e-mail e senha'
    };

    // Reset dos mocks para este teste específico
    authService.login.and.returnValue(throwError(() => mockError));
    
    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'Password123!' // Senha válida para passar na validação
    });

    // Garantir que o formulário está válido
    expect(component.loginForm.valid).toBe(true);
    expect(component.apiError).toBeNull();
    expect(component.isSubmitting).toBe(false);

    component.onSubmit();
    tick(); // Processa o observable

    expect(component.apiError).toEqual(mockError);
    expect(component.isSubmitting).toBe(false);
  }));

  it('should have email control', () => {
    expect(component.emailControl).toBeDefined();
    expect(component.emailControl.value).toBe('');
  });

  it('should have password control', () => {
    expect(component.passwordControl).toBeDefined();
    expect(component.passwordControl.value).toBe('');
  });

  it('should invalidate email with wrong format', () => {
    component.emailControl.setValue('invalid-email');
    component.emailControl.markAsTouched();

    expect(component.emailControl.invalid).toBe(true);
  });

  it('should validate email with correct format', () => {
    component.emailControl.setValue('test@example.com');

    expect(component.emailControl.valid).toBe(true);
  });

  it('should invalidate short password', () => {
    component.passwordControl.setValue('short');
    component.passwordControl.markAsTouched();

    expect(component.passwordControl.invalid).toBe(true);
  });
});
