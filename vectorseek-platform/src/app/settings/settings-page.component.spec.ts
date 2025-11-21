import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { SettingsPageComponent } from './settings-page.component';
import { SettingsService, UserSettings, SettingsError } from '@vectorseek/data-access';
import { ThemeService } from '../core/services/theme.service';

describe('SettingsPageComponent', () => {
  let component: SettingsPageComponent;
  let fixture: ComponentFixture<SettingsPageComponent>;
  let settingsService: jasmine.SpyObj<SettingsService>;
  let themeService: jasmine.SpyObj<ThemeService>;

  const mockSettings: UserSettings = {
    name: 'John Doe',
    theme: 'dark',
    language: 'pt-BR',
    notificationsEnabled: true,
  };

  beforeEach(async () => {
    const settingsServiceSpy = jasmine.createSpyObj('SettingsService', [
      'getSettings',
      'updateSettings',
    ]);
    const themeServiceSpy = jasmine.createSpyObj('ThemeService', [
      'setTheme',
      'getTheme',
    ]);

    await TestBed.configureTestingModule({
      imports: [SettingsPageComponent, ReactiveFormsModule, TranslateModule.forRoot()],
      providers: [
        { provide: SettingsService, useValue: settingsServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy },
      ],
    }).compileComponents();

    settingsService = TestBed.inject(SettingsService) as jasmine.SpyObj<SettingsService>;
    themeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
  });

  beforeEach(() => {
    settingsService.getSettings.and.returnValue(of(mockSettings));
    fixture = TestBed.createComponent(SettingsPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize form with default values', () => {
      // Before ngOnInit
      expect(component.settingsForm).toBeUndefined();

      fixture.detectChanges(); // Triggers ngOnInit

      expect(component.settingsForm).toBeDefined();
      expect(component.settingsForm.get('name')).toBeTruthy();
      expect(component.settingsForm.get('theme')).toBeTruthy();
      expect(component.settingsForm.get('language')).toBeTruthy();
      expect(component.settingsForm.get('notificationsEnabled')).toBeTruthy();
    });

    it('should load settings on init', () => {
      fixture.detectChanges();

      expect(settingsService.getSettings).toHaveBeenCalled();
      expect(component.settingsForm.value).toEqual(mockSettings);
      expect(component.isLoading()).toBe(false);
    });

    it('should handle load error', () => {
      const mockError: SettingsError = {
        status: 500,
        code: 'SETTINGS_SERVER_ERROR',
        summary: 'Erro no servidor',
        description: 'Ocorreu um erro no servidor',
      };

      settingsService.getSettings.and.returnValue(throwError(() => mockError));

      fixture.detectChanges();

      expect(component.loadError()).toBe('Erro no servidor');
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('form validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark form as invalid when name is empty', () => {
      component.settingsForm.patchValue({ name: '' });
      expect(component.settingsForm.invalid).toBe(true);
    });

    it('should mark form as valid with correct values', () => {
      component.settingsForm.patchValue({
        name: 'John Doe',
        theme: 'dark',
        language: 'pt-BR',
        notificationsEnabled: true,
      });

      expect(component.settingsForm.valid).toBe(true);
    });

    it('should validate name field', () => {
      const nameControl = component.nameControl;

      nameControl.setValue('');
      expect(nameControl.invalid).toBe(true);

      nameControl.setValue('John');
      expect(nameControl.valid).toBe(true);
    });

    it('should not submit when form is invalid', () => {
      component.settingsForm.patchValue({ name: '' });
      component.onSubmit();

      expect(settingsService.updateSettings).not.toHaveBeenCalled();
    });
  });

  describe('form submission', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call updateSettings when form is valid', () => {
      const updatedSettings: UserSettings = {
        name: 'Jane Smith',
        theme: 'light',
        language: 'en-US',
        notificationsEnabled: false,
      };

      settingsService.updateSettings.and.returnValue(of(updatedSettings));

      component.settingsForm.patchValue(updatedSettings);
      component.onSubmit();

      expect(settingsService.updateSettings).toHaveBeenCalledWith(updatedSettings);
    });

    it('should update theme service on successful save', (done) => {
      const updatedSettings: UserSettings = {
        ...mockSettings,
        theme: 'light',
      };

      settingsService.updateSettings.and.returnValue(of(updatedSettings));

      component.settingsForm.patchValue(updatedSettings);
      component.onSubmit();

      setTimeout(() => {
        expect(themeService.setTheme).toHaveBeenCalledWith('light');
        expect(component.saveSuccess()).toBe(true);
        expect(component.isSaving()).toBe(false);
        done();
      }, 0);
    });

    it('should handle save error', (done) => {
      const mockError: SettingsError = {
        status: 400,
        code: 'SETTINGS_INVALID_DATA',
        summary: 'Dados inválidos',
      };

      settingsService.updateSettings.and.returnValue(throwError(() => mockError));

      component.onSubmit();

      setTimeout(() => {
        expect(component.saveError()).toBe('Dados inválidos');
        expect(component.isSaving()).toBe(false);
        done();
      }, 0);
    });

    it('should set isSaving during save operation', () => {
      settingsService.updateSettings.and.returnValue(of(mockSettings));

      component.onSubmit();

      // Should be saving immediately after submit
      expect(component.isSaving()).toBe(true);
    });
  });

  describe('theme change', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update theme service when theme changes', () => {
      component.settingsForm.patchValue({ theme: 'light' });
      component.onThemeChange();

      expect(themeService.setTheme).toHaveBeenCalledWith('light');
    });

    it('should handle theme toggle from dark to light', () => {
      component.settingsForm.patchValue({ theme: 'dark' });
      component.onThemeChange();
      expect(themeService.setTheme).toHaveBeenCalledWith('dark');

      component.settingsForm.patchValue({ theme: 'light' });
      component.onThemeChange();
      expect(themeService.setTheme).toHaveBeenCalledWith('light');
    });
  });

  describe('form reset', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reload settings when reset is called', () => {
      settingsService.getSettings.calls.reset();

      component.onReset();

      expect(settingsService.getSettings).toHaveBeenCalled();
    });

    it('should clear errors when reset is called', () => {
      component.saveError.set('Some error');
      component.saveSuccess.set(true);

      component.onReset();

      expect(component.saveError()).toBeNull();
      expect(component.saveSuccess()).toBe(false);
    });
  });

  describe('form control getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return correct form controls', () => {
      expect(component.nameControl).toBe(component.settingsForm.get('name'));
      expect(component.themeControl).toBe(component.settingsForm.get('theme'));
      expect(component.languageControl).toBe(component.settingsForm.get('language'));
      expect(component.notificationsControl).toBe(
        component.settingsForm.get('notificationsEnabled')
      );
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe on destroy', () => {
      fixture.detectChanges();

      const destroySpy = spyOn(component['destroy$'], 'next');
      const completespy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completespy).toHaveBeenCalled();
    });
  });
});
