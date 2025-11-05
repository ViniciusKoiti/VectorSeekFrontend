import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FieldErrorComponent } from './field-error.component';

describe('FieldErrorComponent', () => {
  let component: FieldErrorComponent;
  let fixture: ComponentFixture<FieldErrorComponent>;
  let translateService: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldErrorComponent, TranslateModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(FieldErrorComponent);
    component = fixture.componentInstance;
    translateService = TestBed.inject(TranslateService);

    // Mock translate.instant to avoid async issues
    spyOn(translateService, 'instant').and.returnValue('Error message');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not show error when control is valid', () => {
    const control = new FormControl('valid@example.com', Validators.email);
    component.control = control;

    expect(component.shouldShowError()).toBe(false);
  });

  it('should not show error when control is untouched', () => {
    const control = new FormControl('', Validators.required);
    component.control = control;

    expect(component.shouldShowError()).toBe(false);
  });

  it('should show error when control is invalid and touched', () => {
    const control = new FormControl('', Validators.required);
    control.markAsTouched();
    component.control = control;

    expect(component.shouldShowError()).toBe(true);
  });

  it('should handle null control', () => {
    component.control = null;

    expect(component.shouldShowError()).toBe(false);
  });

  it('should get error message from zod error', () => {
    const control = new FormControl('');
    control.setErrors({ zod: { message: 'auth.login.errors.required' } });
    control.markAsTouched();
    component.control = control;

    const message = component.getErrorMessage();

    expect(translateService.instant).toHaveBeenCalledWith('auth.login.errors.required', jasmine.any(Object));
  });

  it('should get error message from required error', () => {
    const control = new FormControl('', Validators.required);
    control.markAsTouched();
    component.control = control;

    component.getErrorMessage();

    expect(translateService.instant).toHaveBeenCalledWith('auth.login.errors.required');
  });

  it('should get error message from email error', () => {
    const control = new FormControl('invalid', Validators.email);
    control.markAsTouched();
    component.control = control;

    component.getErrorMessage();

    expect(translateService.instant).toHaveBeenCalledWith('auth.login.errors.email');
  });

  it('should get error message from minlength error', () => {
    const control = new FormControl('ab', Validators.minLength(6));
    control.markAsTouched();
    component.control = control;

    component.getErrorMessage();

    expect(translateService.instant).toHaveBeenCalledWith('auth.login.errors.minLength', { min: 6 });
  });

  it('should get error message from pattern error', () => {
    const control = new FormControl('weak', Validators.pattern(/^(?=.*[A-Z]).*$/));
    control.markAsTouched();
    component.control = control;

    component.getErrorMessage();

    expect(translateService.instant).toHaveBeenCalledWith('auth.register.errors.passwordPattern');
  });

  it('should return generic error for unknown error type', () => {
    const control = new FormControl('');
    control.setErrors({ custom: true });
    control.markAsTouched();
    component.control = control;

    component.getErrorMessage();

    expect(translateService.instant).toHaveBeenCalledWith('auth.apiErrors.unexpectedError');
  });

  it('should return empty string when no control', () => {
    component.control = null;

    const message = component.getErrorMessage();

    expect(message).toBe('');
  });

  it('should return empty string when no errors', () => {
    const control = new FormControl('valid');
    component.control = control;

    const message = component.getErrorMessage();

    expect(message).toBe('');
  });

  it('should handle zod error with non-translation message', () => {
    const control = new FormControl('');
    control.setErrors({ zod: { message: 'Direct error message' } });
    control.markAsTouched();
    component.control = control;

    const message = component.getErrorMessage();

    expect(message).toBe('Direct error message');
  });
});
