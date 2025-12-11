import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ApiErrorResponse, ErrorCodes } from '../constants/error-codes';

@Injectable({ providedIn: 'root' })
export class ErrorService {

    // Observable para componentes específicos tratarem erros
    private errorSubject = new Subject<ApiErrorResponse>();
    public error$ = this.errorSubject.asObservable();

    /**
     * Extrai erros de validação do params
     */
    getFieldErrors(error: ApiErrorResponse): Map<string, string> {
        const fieldErrors = new Map<string, string>();

        if (error.code === ErrorCodes.VALIDATION_ERROR && error.params?.['errors']) {
            for (const err of error.params['errors']) {
                // Assume format "body.field" or just "field"
                const field = err.field ? err.field.replace('body.', '') : '';
                if (field) {
                    fieldErrors.set(field, this.translateFieldError(err.type, err.message));
                }
            }
        }

        if (error.code === ErrorCodes.DOC_MISSING_FIELDS && error.params?.['missing_fields']) {
            for (const field of error.params['missing_fields']) {
                fieldErrors.set(field, 'Campo obrigatório');
            }
        }

        return fieldErrors;
    }

    private translateFieldError(type: string, message: string): string {
        const translations: Record<string, string> = {
            'missing': 'Campo obrigatório',
            'value_error': 'Valor inválido',
            'string_too_short': 'Texto muito curto',
            'string_too_long': 'Texto muito longo',
            'invalid_email': 'Email inválido',
        };
        return translations[type] || message;
    }
}
