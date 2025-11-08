import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../libs/data-access/src/lib/auth/auth.service';
import { AuthError } from '../../../libs/data-access/src/lib/auth/auth.models';
import { FieldErrorComponent } from './components/field-error.component';
import { forgotPasswordSchema, ForgotPasswordFormData } from './schemas/auth.schemas';
import { zodValidator } from './utils/zod-validators';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, TranslateModule, FieldErrorComponent],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);

  forgotPasswordForm!: FormGroup;
  isSubmitting = false;
  apiError: AuthError | null = null;
  successMessage: string | null = null;

  ngOnInit(): void {
    console.info('ForgotPasswordComponent inicializado');
    this.translate.use('pt-BR');
    this.initForm();
  }

  ngOnDestroy(): void {
    console.info('ForgotPasswordComponent destruído');
  }

  private initForm(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, zodValidator(forgotPasswordSchema.shape.email)]]
    });
  }

  get emailControl() {
    return this.forgotPasswordForm.get('email')!;
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.apiError = null;
    this.successMessage = null;

    const formData = this.forgotPasswordForm.value as ForgotPasswordFormData;

    this.authService.requestMagicLink(formData).subscribe({
      next: (response) => {
        console.info('Link mágico enviado com sucesso', response);
        this.successMessage = response.message;
        this.forgotPasswordForm.reset();
        this.isSubmitting = false;
      },
      error: (error: AuthError) => {
        console.error('Erro ao enviar link mágico', error);
        this.apiError = error;
        this.isSubmitting = false;
      }
    });
  }
}

