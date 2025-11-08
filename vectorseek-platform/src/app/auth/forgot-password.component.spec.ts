import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../../libs/data-access/src/lib/auth/auth.service';
import { AuthError } from '../../../libs/data-access/src/lib/auth/auth.models';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['requestMagicLink']);

    await TestBed.configureTestingModule({
      imports: [
        ForgotPasswordComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty email', () => {
    expect(component.forgotPasswordForm.value).toEqual({
      email: ''
    });
  });

  it('should mark form as invalid when empty', () => {
    expect(component.forgotPasswordForm.invalid).toBe(true);
  });

  it('should mark form as valid with correct email', () => {
    component.forgotPasswordForm.patchValue({
      email: 'test@example.com'
    });

    expect(component.forgotPasswordForm.valid).toBe(true);
  });

  it('should not submit when form is invalid', () => {
    component.onSubmit();

    expect(authService.requestMagicLink).not.toHaveBeenCalled();
  });

  it('should call authService.requestMagicLink when form is valid', () => {
    const mockResponse = {
      message: 'Link mágico enviado para seu e-mail'
    };

    authService.requestMagicLink.and.returnValue(of(mockResponse));

    component.forgotPasswordForm.patchValue({
      email: 'test@example.com'
    });

    component.onSubmit();

    expect(authService.requestMagicLink).toHaveBeenCalledWith({
      email: 'test@example.com'
    });
  });

  it('should display success message after successful request', () => {
    const mockResponse = {
      message: 'Link mágico enviado para seu e-mail'
    };

    authService.requestMagicLink.and.returnValue(of(mockResponse));

    component.forgotPasswordForm.patchValue({
      email: 'test@example.com'
    });

    component.onSubmit();

    expect(component.successMessage).toBe('Link mágico enviado para seu e-mail');
    expect(component.isSubmitting).toBe(false);
  });

  it('should reset form after successful request', () => {
    const mockResponse = {
      message: 'Link mágico enviado'
    };

    authService.requestMagicLink.and.returnValue(of(mockResponse));

    component.forgotPasswordForm.patchValue({
      email: 'test@example.com'
    });

    component.onSubmit();

    expect(component.forgotPasswordForm.value.email).toBe('');
  });

  it('should handle request magic link errors', () => {
    const mockError: AuthError = {
      status: 429,
      code: 'RATE_LIMITED',
      summary: 'Muitas solicitações',
      description: 'Aguarde alguns instantes',
      retryAfterSeconds: 120
    };

    authService.requestMagicLink.and.returnValue(throwError(() => mockError));

    component.forgotPasswordForm.patchValue({
      email: 'test@example.com'
    });

    component.onSubmit();

    expect(component.apiError).toEqual(mockError);
    expect(component.isSubmitting).toBe(false);
    expect(component.successMessage).toBeNull();
  });

  it('should clear errors on new submit attempt', () => {
    component.apiError = {
      status: 429,
      code: 'RATE_LIMITED',
      summary: 'Erro anterior'
    };

    authService.requestMagicLink.and.returnValue(of({ message: 'Success' }));

    component.forgotPasswordForm.patchValue({
      email: 'test@example.com'
    });

    component.onSubmit();

    expect(component.apiError).toBeNull();
  });

  it('should have email control', () => {
    expect(component.emailControl).toBeDefined();
    expect(component.emailControl.value).toBe('');
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
});
