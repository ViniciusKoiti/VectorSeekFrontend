import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { SettingsService, UserSettings, SettingsError } from '@vectorseek/data-access';
import { ThemeService } from '../core/services/theme.service';
import { settingsSchema } from './schemas/settings.schemas';
import { zodValidator } from '../auth/utils/zod-validators';

/**
 * Settings page component
 *
 * Allows users to configure their preferences including:
 * - Name
 * - Theme (light/dark)
 * - Language (pt-BR/en-US)
 * - Notifications
 */
@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.css'],
})
export class SettingsPageComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(SettingsService);
  private readonly themeService = inject(ThemeService);
  private readonly destroy$ = new Subject<void>();

  settingsForm!: FormGroup;
  isLoading = signal(true);
  isSaving = signal(false);
  loadError = signal<string | null>(null);
  saveError = signal<string | null>(null);
  saveSuccess = signal(false);

  ngOnInit(): void {
    this.initForm();
    this.loadSettings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize form with validation
   */
  private initForm(): void {
    this.settingsForm = this.fb.group({
      name: ['', [Validators.required, zodValidator(settingsSchema.shape.name)]],
      theme: ['dark', [Validators.required, zodValidator(settingsSchema.shape.theme)]],
      language: ['pt-BR', [Validators.required, zodValidator(settingsSchema.shape.language)]],
      notificationsEnabled: [false],
    });
  }

  /**
   * Load current settings from server
   */
  private loadSettings(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.settingsService
      .getSettings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings) => {
          this.settingsForm.patchValue({
            name: settings.name,
            theme: settings.theme,
            language: settings.language,
            notificationsEnabled: settings.notificationsEnabled,
          });
          this.isLoading.set(false);
        },
        error: (error: SettingsError) => {
          this.loadError.set(error.summary);
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.saveError.set(null);
    this.saveSuccess.set(false);

    const formData = this.settingsForm.value as UserSettings;

    this.settingsService
      .updateSettings(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedSettings) => {
          // Update theme service
          this.themeService.setTheme(updatedSettings.theme);

          this.isSaving.set(false);
          this.saveSuccess.set(true);

          // Hide success message after 3 seconds
          setTimeout(() => this.saveSuccess.set(false), 3000);
        },
        error: (error: SettingsError) => {
          this.saveError.set(error.summary);
          this.isSaving.set(false);
        },
      });
  }

  /**
   * Handle theme change in real-time
   */
  onThemeChange(): void {
    const theme = this.settingsForm.get('theme')?.value as 'light' | 'dark';
    if (theme) {
      this.themeService.setTheme(theme);
    }
  }

  /**
   * Reset form to initial values
   */
  onReset(): void {
    this.loadSettings();
    this.saveError.set(null);
    this.saveSuccess.set(false);
  }

  // Form control getters for template
  get nameControl() {
    return this.settingsForm.get('name')!;
  }

  get themeControl() {
    return this.settingsForm.get('theme')!;
  }

  get languageControl() {
    return this.settingsForm.get('language')!;
  }

  get notificationsControl() {
    return this.settingsForm.get('notificationsEnabled')!;
  }
}
