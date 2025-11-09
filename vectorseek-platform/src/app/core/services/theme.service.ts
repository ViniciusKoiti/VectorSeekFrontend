import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  private currentTheme: 'light' | 'dark';

  constructor() {
    this.currentTheme = this.getThemeFromStorage() || 'dark';
    this.applyTheme(this.currentTheme);
  }

  getTheme(): 'light' | 'dark' {
    return this.currentTheme;
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.currentTheme = theme;
    this.saveThemeToStorage(theme);
    this.applyTheme(theme);
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    if (theme === 'light') {
      document.body.setAttribute('data-theme', 'light');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }

  private getThemeFromStorage(): 'light' | 'dark' | null {
    return localStorage.getItem(this.THEME_KEY) as 'light' | 'dark' | null;
  }

  private saveThemeToStorage(theme: 'light' | 'dark'): void {
    localStorage.setItem(this.THEME_KEY, theme);
  }
}
