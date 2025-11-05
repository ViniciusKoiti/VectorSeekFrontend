import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ZodSchema, ZodError } from 'zod';

/**
 * Cria um validador do Angular a partir de um schema Zod
 *
 * Integra a validação Zod com Angular Reactive Forms
 * conforme recomendado no ADR-001 e E1-A1-3
 *
 * @param schema - Schema Zod para validação
 * @param fieldName - Nome do campo a ser validado (opcional)
 * @returns ValidatorFn do Angular
 *
 * @example
 * ```typescript
 * const emailControl = new FormControl('', zodValidator(z.string().email()));
 * ```
 */
export function zodValidator(schema: ZodSchema, fieldName?: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value && control.value !== 0 && control.value !== false) {
      // Se o campo está vazio, deixe o validador 'required' lidar com isso
      return null;
    }

    try {
      schema.parse(control.value);
      return null;
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.errors[0];
        return {
          zod: {
            message: firstError.message,
            path: firstError.path.join('.'),
            code: firstError.code
          }
        };
      }
      return { zod: { message: 'Validação falhou' } };
    }
  };
}

/**
 * Valida um formulário inteiro contra um schema Zod
 *
 * Útil para validação de formulários completos com múltiplos campos
 *
 * @param schema - Schema Zod para validação do formulário
 * @returns ValidatorFn do Angular
 *
 * @example
 * ```typescript
 * const form = new FormGroup({
 *   email: new FormControl(''),
 *   password: new FormControl('')
 * }, { validators: zodFormValidator(loginSchema) });
 * ```
 */
export function zodFormValidator(schema: ZodSchema): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    try {
      schema.parse(control.value);
      return null;
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: ValidationErrors = {};

        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push({
            message: err.message,
            code: err.code
          });
        });

        return errors;
      }
      return { form: { message: 'Validação do formulário falhou' } };
    }
  };
}

/**
 * Extrai a mensagem de erro do Zod de um FormControl
 *
 * @param control - FormControl do Angular
 * @returns Mensagem de erro ou null
 *
 * @example
 * ```typescript
 * const errorMessage = getZodErrorMessage(this.emailControl);
 * ```
 */
export function getZodErrorMessage(control: AbstractControl | null): string | null {
  if (!control || !control.errors) {
    return null;
  }

  if (control.errors['zod']) {
    return control.errors['zod'].message;
  }

  return null;
}
