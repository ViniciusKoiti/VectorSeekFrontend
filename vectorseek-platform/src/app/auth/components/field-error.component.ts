import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

/**
 * Componente reutilizável para exibição de erros de formulário
 *
 * Integra com Angular Reactive Forms e ngx-translate para mensagens localizadas
 * Conforme especificado em E1-A1-3 e ADR-001
 *
 * @example
 * ```html
 * <app-field-error [control]="emailControl" [fieldName]="'email'"></app-field-error>
 * ```
 */
@Component({
  selector: 'app-field-error',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './field-error.component.html',
  styleUrls: ['./field-error.component.css']
})
export class FieldErrorComponent {
  @Input() control: AbstractControl | null = null;
  @Input() fieldName: string = '';

  constructor(private translate: TranslateService) {}

  shouldShowError(): boolean {
    return !!(this.control && this.control.invalid && this.control.touched);
  }

  getErrorMessage(): string {
    if (!this.control || !this.control.errors) {
      return '';
    }

    const errors = this.control.errors;

    // Erros do Zod
    if (errors['zod']) {
      const zodMessage = errors['zod'].message;
      // Se a mensagem é uma chave de tradução, traduz
      if (zodMessage.startsWith('auth.')) {
        return this.translate.instant(zodMessage, this.getTranslationParams(errors['zod']));
      }
      return zodMessage;
    }

    // Erros padrão do Angular
    if (errors['required']) {
      return this.translate.instant('auth.login.errors.required');
    }

    if (errors['email']) {
      return this.translate.instant('auth.login.errors.email');
    }

    if (errors['minlength']) {
      return this.translate.instant('auth.login.errors.minLength', {
        min: errors['minlength'].requiredLength
      });
    }

    if (errors['pattern']) {
      return this.translate.instant('auth.register.errors.passwordPattern');
    }



    // Erro genérico
    return this.translate.instant('auth.apiErrors.unexpectedError');
  }

  private getTranslationParams(zodError: any): any {
    // Extrai parâmetros do erro Zod se necessário
    // Por exemplo, para minLength
    const params: any = {};

    if (zodError.code === 'too_small' && zodError.minimum) {
      params.min = zodError.minimum;
    }

    return params;
  }
}
