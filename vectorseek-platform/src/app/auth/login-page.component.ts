import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../libs/data-access/src/lib/auth/auth.service';
import { AuthError } from '../../../libs/data-access/src/lib/auth/auth.models';
import { FieldErrorComponent } from './components/field-error.component';
import { loginSchema, LoginFormData } from './schemas/auth.schemas';
import { zodValidator } from './utils/zod-validators';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, TranslateModule, FieldErrorComponent],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  loginForm!: FormGroup;
  isSubmitting = false;
  apiError: AuthError | null = null;

  ngOnInit(): void {
    console.info('LoginPageComponent inicializado');
    this.translate.use('pt-BR');
    this.initForm();
  }

  ngOnDestroy(): void {
    console.info('LoginPageComponent destruído');
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, zodValidator(loginSchema.shape.email)]],
      password: ['', [Validators.required, zodValidator(loginSchema.shape.password)]],
      rememberMe: [false]
    });
  }

  get emailControl() {
    return this.loginForm.get('email')!;
  }

  get passwordControl() {
    return this.loginForm.get('password')!;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.apiError = null;

    const formData = this.loginForm.value as LoginFormData;

    this.authService.login(formData).subscribe({
      next: (response) => {
        console.info('Login realizado com sucesso', response);
        this.router.navigate(['/app/dashboard']);
        this.isSubmitting = false;
      },
      error: (error: AuthError) => {
        console.error('Erro no login', error);
        this.apiError = error;
        this.isSubmitting = false;
      }
    });
  }
}

