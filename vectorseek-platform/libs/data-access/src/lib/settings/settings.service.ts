import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { SETTINGS_API_ENDPOINTS } from './settings.api';
import {
  UserSettings,
  UserSettingsApiResponse,
  UserSettingsApiRequest,
  SettingsError,
  SettingsAction,
} from './settings.models';

/**
 * Service for managing user settings
 *
 * Provides methods to retrieve and update user preferences including
 * theme, language, and notification settings.
 *
 * @example
 * ```typescript
 * const settingsService = inject(SettingsService);
 *
 * // Get current settings
 * settingsService.getSettings().subscribe(settings => {
 *   console.log('Current theme:', settings.theme);
 * });
 *
 * // Update settings
 * settingsService.updateSettings({
 *   name: 'John Doe',
 *   theme: 'dark',
 *   language: 'pt-BR',
 *   notificationsEnabled: true
 * }).subscribe(updated => {
 *   console.log('Settings updated:', updated);
 * });
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly http = inject(HttpClient);

  /**
   * Get current user settings
   *
   * @returns Observable with user settings
   */
  getSettings(): Observable<UserSettings> {
    return this.http
      .get<UserSettingsApiResponse>(SETTINGS_API_ENDPOINTS.settings())
      .pipe(
        map((response) => this.normalizeSettings(response)),
        catchError((error) => this.handleError('get', error))
      );
  }

  /**
   * Update user settings
   *
   * @param settings - Settings to update
   * @returns Observable with updated settings
   */
  updateSettings(settings: UserSettings): Observable<UserSettings> {
    const payload = this.toApiRequest(settings);

    return this.http
      .patch<UserSettingsApiResponse>(
        SETTINGS_API_ENDPOINTS.settings(),
        payload
      )
      .pipe(
        map((response) => this.normalizeSettings(response)),
        catchError((error) => this.handleError('update', error))
      );
  }

  /**
   * Normalize API response to domain model
   */
  private normalizeSettings(response: UserSettingsApiResponse): UserSettings {
    return {
      name: response.name,
      theme: response.theme,
      language: response.language,
      notificationsEnabled: response.notifications_enabled,
    };
  }

  /**
   * Convert domain model to API request
   */
  private toApiRequest(settings: UserSettings): UserSettingsApiRequest {
    return {
      name: settings.name,
      theme: settings.theme,
      language: settings.language,
      notifications_enabled: settings.notificationsEnabled,
    };
  }

  /**
   * Handle HTTP errors and normalize error format
   */
  private handleError(
    action: SettingsAction,
    error: unknown
  ): Observable<never> {
    const normalizedError = this.normalizeError(action, error);
    return throwError(() => normalizedError);
  }

  /**
   * Normalize error to consistent format
   */
  private normalizeError(action: SettingsAction, error: unknown): SettingsError {
    if (!(error instanceof HttpErrorResponse)) {
      return {
        status: 0,
        code: 'SETTINGS_UNEXPECTED_ERROR',
        summary: 'Erro inesperado',
        description: 'Ocorreu um erro inesperado ao processar as configurações.',
      };
    }

    const status = error.status;

    // Handle specific status codes
    switch (status) {
      case 400:
        return {
          status,
          code: 'SETTINGS_INVALID_DATA',
          summary: 'Dados inválidos',
          description:
            error.error?.message ||
            'Os dados fornecidos são inválidos. Verifique e tente novamente.',
        };

      case 401:
        return {
          status,
          code: 'SETTINGS_UNAUTHORIZED',
          summary: 'Não autorizado',
          description: 'Você precisa estar autenticado para acessar as configurações.',
        };

      case 403:
        return {
          status,
          code: 'SETTINGS_FORBIDDEN',
          summary: 'Acesso negado',
          description: 'Você não tem permissão para modificar estas configurações.',
        };

      case 404:
        return {
          status,
          code: 'SETTINGS_NOT_FOUND',
          summary: 'Configurações não encontradas',
          description: 'Não foi possível encontrar as configurações do usuário.',
        };

      case 422:
        return {
          status,
          code: 'SETTINGS_VALIDATION_ERROR',
          summary: 'Erro de validação',
          description:
            error.error?.message ||
            'Os dados fornecidos não passaram na validação.',
        };

      case 500:
        return {
          status,
          code: 'SETTINGS_SERVER_ERROR',
          summary: 'Erro no servidor',
          description: 'Ocorreu um erro no servidor. Tente novamente mais tarde.',
        };

      default:
        return {
          status,
          code: 'SETTINGS_HTTP_ERROR',
          summary: `Erro HTTP ${status}`,
          description:
            error.error?.message ||
            'Ocorreu um erro ao processar as configurações.',
        };
    }
  }
}
