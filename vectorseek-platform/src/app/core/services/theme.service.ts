import { Injectable } from '@angular/core';

/**
 * Service for managing application theme
 *
 * Handles theme switching between light and dark modes with persistence
 * to localStorage. The theme is applied via data-theme attribute on body.
 *
 * @example
 * ```typescript
 * const themeService = inject(ThemeService);
 *
 * // Get current theme
 * const current = themeService.getTheme();
 *
 * // Set theme
 * themeService.setTheme('dark');
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  private currentTheme: 'light' | 'dark';

  constructor() {
    // Load theme from localStorage or default to dark
    this.currentTheme = this.getThemeFromStorage() || 'dark';
    this.applyTheme(this.currentTheme);
  }

  /**
   * Get current theme
   *
   * @returns Current theme ('light' or 'dark')
   */
  getTheme(): 'light' | 'dark' {
    return this.currentTheme;
  }

  /**
   * Set theme and persist to localStorage
   *
   * Updates the current theme, saves to localStorage, and applies
   * the theme to the DOM immediately.
   *
   * @param theme - Theme to set ('light' or 'dark')
   */
  setTheme(theme: 'light' | 'dark'): void {
    this.currentTheme = theme;
    this.saveThemeToStorage(theme);
    this.applyTheme(theme);
  }

  /**
   * Apply theme to DOM
   *
   * Sets the data-theme attribute on body element.
   * Light theme: data-theme="light"
   * Dark theme: no data-theme attribute (default)
   */
  private applyTheme(theme: 'light' | 'dark'): void {
    if (theme === 'light') {
      document.body.setAttribute('data-theme', 'light');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }

  /**
   * Get theme from localStorage
   *
   * @returns Theme from storage or null if not set
   */
  private getThemeFromStorage(): 'light' | 'dark' | null {
    return localStorage.getItem(this.THEME_KEY) as 'light' | 'dark' | null;
  }

  /**
   * Save theme to localStorage
   *
   * @param theme - Theme to save
   */
  private saveThemeToStorage(theme: 'light' | 'dark'): void {
    localStorage.setItem(this.THEME_KEY, theme);
  }
}
