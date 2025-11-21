/**
 * User settings models and types
 */

/**
 * Theme options
 */
export type Theme = 'light' | 'dark';

/**
 * Language options
 */
export type Language = 'pt-BR' | 'en-US';

/**
 * User settings (domain model - camelCase)
 */
export interface UserSettings {
  /** User's full name */
  name: string;
  /** Preferred theme */
  theme: Theme;
  /** Preferred language */
  language: Language;
  /** Email notifications enabled */
  notificationsEnabled: boolean;
}

/**
 * User settings API response (snake_case)
 */
export interface UserSettingsApiResponse {
  name: string;
  theme: Theme;
  language: Language;
  notifications_enabled: boolean;
}

/**
 * User settings API request (snake_case)
 */
export interface UserSettingsApiRequest {
  name: string;
  theme: Theme;
  language: Language;
  notifications_enabled: boolean;
}

/**
 * Settings error types
 */
export type SettingsAction = 'get' | 'update';

/**
 * Settings error
 */
export interface SettingsError {
  status: number;
  code: string;
  summary: string;
  description?: string;
}
