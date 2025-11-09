import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthStore } from '@vectorseek/state';
import { AuthService } from '../../../libs/data-access/src/lib/auth/auth.service';
import { AuthError, PlanType, RegisterRequest } from '../../../libs/data-access/src/lib/auth/auth.models';
import { FieldErrorComponent } from './components/field-error.component';
import { registerSchema, RegisterFormData } from './schemas/auth.schemas';
import { zodValidator } from './utils/zod-validators';
import { AuthErrorPipe } from '@vectorseek/data-access/lib/auth/auth-error.pipe';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, TranslateModule, FieldErrorComponent, AuthErrorPipe],
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.css']
})
export class RegisterPageComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private authStore = inject(AuthStore);

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
      plan: [PlanType.FREE, [zodValidator(registerSchema.shape.plan)]],
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

    const formData = this.registerForm.getRawValue() as RegisterFormData;
    const payload: RegisterRequest = {
      email: formData.email,
      password: formData.password,
      full_name: formData.fullName.trim(),
      plan: formData.plan ?? PlanType.FREE,
      acceptTerms: formData.acceptTerms
    };

    this.authService.register(payload).subscribe({
      next: (response) => {
        console.info('Registro realizado com sucesso', response);
        this.authStore.setSession(response);
        this.router.navigate(['/app/dashboard']);
      
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

