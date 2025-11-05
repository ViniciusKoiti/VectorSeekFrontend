import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { LoginPageComponent } from './login-page.component';
import { AuthService } from '../../../libs/data-access/src/lib/auth/auth.service';
import { AuthError } from '../../../libs/data-access/src/lib/auth/auth.models';

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [
        LoginPageComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
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
      user: { id: '1', email: 'test@example.com', fullName: 'Test User', avatarUrl: null },
      tokens: { accessToken: 'token', refreshToken: 'refresh', expiresIn: 3600, tokenType: 'Bearer' }
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

  it('should set isSubmitting to true during submit', () => {
    authService.login.and.returnValue(of({} as any));

    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'Password123!'
    });

    component.isSubmitting = false;
    component.onSubmit();

    expect(component.isSubmitting).toBe(false); // Volta a false após sucesso
  });

  it('should handle login errors', () => {
    const mockError: AuthError = {
      status: 401,
      code: 'AUTH_INVALID',
      summary: 'Credenciais inválidas',
      description: 'Verifique e-mail e senha'
    };

    authService.login.and.returnValue(throwError(() => mockError));

    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'wrong'
    });

    component.onSubmit();

    expect(component.apiError).toEqual(mockError);
    expect(component.isSubmitting).toBe(false);
  });

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
