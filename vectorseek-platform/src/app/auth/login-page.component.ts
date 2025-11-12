import { Component, OnDestroy, OnInit, inject, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../libs/data-access/src/lib/auth/auth.service';
import { AuthError } from '../../../libs/data-access/src/lib/auth/auth.models';
import { AuthStore } from '../../../libs/state/src/lib/auth/auth.store';
import { FieldErrorComponent } from './components/field-error.component';
import { loginSchema, LoginFormData } from './schemas/auth.schemas';
import { zodValidator } from './utils/zod-validators';
import { AuthErrorPipe } from '@vectorseek/data-access/lib/auth/auth-error.pipe';
import { TypewriterComponent } from './components/typewriter/typewriter.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, TranslateModule, FieldErrorComponent, AuthErrorPipe, TypewriterComponent],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private authStore = inject(AuthStore);
  private router = inject(Router);
  private translate = inject(TranslateService);

  loginForm!: FormGroup;
  isSubmitting = false;
  apiError: AuthError | null = null;
  animationsDisabled = false;

  @HostBinding('class.animations-disabled') get animationsDisabledClass() {
    return this.animationsDisabled;
  }

  ngOnInit(): void {
    this.translate.use('pt-BR');
    this.initForm();
    if (typeof localStorage !== 'undefined') {
      this.animationsDisabled = localStorage.getItem('animationsDisabled') === 'true';
    }
  }

  ngOnDestroy(): void {
    console.info('LoginPageComponent destruído');
  }

  toggleAnimations(): void {
    this.animationsDisabled = !this.animationsDisabled;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('animationsDisabled', this.animationsDisabled.toString());
    }
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
      next: (session) => {
        this.authStore.setSession(session);
        this.authService.me().subscribe({
          next: (user) => {
            this.authStore.setUser(user);
            this.router.navigate(['/app/qna']);
            this.isSubmitting = false;
          },
          error: (error: AuthError) => {
            this.apiError = error;
            this.isSubmitting = false;
            this.authStore.clearSession();
          }
        });
      },
      error: (error: AuthError) => {
        this.apiError = error;
        this.isSubmitting = false;
      }
    });
  }
}

