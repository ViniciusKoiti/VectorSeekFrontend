import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { RegisterPageComponent } from './register-page.component';
import { AuthService } from '../../../libs/data-access/src/lib/auth/auth.service';
import { AuthError } from '../../../libs/data-access/src/lib/auth/auth.models';

describe('RegisterPageComponent', () => {
  let component: RegisterPageComponent;
  let fixture: ComponentFixture<RegisterPageComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);

    await TestBed.configureTestingModule({
      imports: [
        RegisterPageComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture = TestBed.createComponent(RegisterPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.registerForm.value).toEqual({
      fullName: '',
      email: '',
      password: '',
      acceptTerms: false
    });
  });

  it('should mark form as invalid when empty', () => {
    expect(component.registerForm.invalid).toBe(true);
  });

  it('should mark form as valid with correct values', () => {
    component.registerForm.patchValue({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'StrongPass123!',
      acceptTerms: true
    });

    expect(component.registerForm.valid).toBe(true);
  });

  it('should not submit when form is invalid', () => {
    component.onSubmit();

    expect(authService.register).not.toHaveBeenCalled();
  });

  it('should call authService.register when form is valid', () => {
    const mockResponse = {
      user: { id: '1', email: 'john@example.com', fullName: 'John Doe', avatarUrl: null },
      tokens: { accessToken: 'token', refreshToken: 'refresh', expiresIn: 3600, tokenType: 'Bearer' }
    };

    authService.register.and.returnValue(of(mockResponse));

    component.registerForm.patchValue({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'StrongPass123!',
      acceptTerms: true
    });

    component.onSubmit();

    expect(authService.register).toHaveBeenCalled();
  });

  it('should handle registration errors with field errors', () => {
    const mockError: AuthError = {
      status: 422,
      code: 'VALIDATION_FAILED',
      summary: 'Dados inválidos',
      description: 'Alguns campos precisam de atenção',
      fieldErrors: {
        password: ['Senha muito fraca'],
        email: ['Email já cadastrado']
      }
    };

    authService.register.and.returnValue(throwError(() => mockError));

    component.registerForm.patchValue({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'weak',
      acceptTerms: true
    });

    component.onSubmit();

    expect(component.apiError).toEqual(mockError);
    expect(component.isSubmitting).toBe(false);
  });

  it('should format field errors for display', () => {
    component.apiError = {
      status: 422,
      code: 'VALIDATION_FAILED',
      summary: 'Dados inválidos',
      fieldErrors: {
        password: ['Senha muito fraca', 'Deve conter números'],
        email: ['Email já cadastrado']
      }
    };

    const errors = component.getFieldErrors();

    expect(errors.length).toBe(2);
    expect(errors[0].field).toBe('password');
    expect(errors[0].errors).toEqual(['Senha muito fraca', 'Deve conter números']);
    expect(errors[1].field).toBe('email');
    expect(errors[1].errors).toEqual(['Email já cadastrado']);
  });

  it('should return empty array when no field errors', () => {
    component.apiError = null;

    const errors = component.getFieldErrors();

    expect(errors).toEqual([]);
  });

  it('should require accept terms to be true', () => {
    component.registerForm.patchValue({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'StrongPass123!',
      acceptTerms: false
    });

    expect(component.acceptTermsControl.invalid).toBe(true);
  });

  it('should validate strong password', () => {
    component.passwordControl.setValue('WeakPassword');
    component.passwordControl.markAsTouched();

    // Password sem caracteres especiais deve ser inválido
    expect(component.passwordControl.invalid).toBe(true);
  });
});
