import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { SettingsService } from './settings.service';
import {
  UserSettings,
  UserSettingsApiResponse,
  SettingsError,
} from './settings.models';
import { SETTINGS_API_ENDPOINTS } from './settings.api';

describe('SettingsService', () => {
  let service: SettingsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SettingsService],
    });

    service = TestBed.inject(SettingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSettings', () => {
    it('should retrieve user settings and normalize to domain model', (done) => {
      const mockApiResponse: UserSettingsApiResponse = {
        name: 'John Doe',
        theme: 'dark',
        language: 'pt-BR',
        notifications_enabled: true,
      };

      const expectedSettings: UserSettings = {
        name: 'John Doe',
        theme: 'dark',
        language: 'pt-BR',
        notificationsEnabled: true,
      };

      service.getSettings().subscribe({
        next: (settings) => {
          expect(settings).toEqual(expectedSettings);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(SETTINGS_API_ENDPOINTS.settings());
      expect(req.request.method).toBe('GET');
      req.flush(mockApiResponse);
    });

    it('should handle 401 unauthorized error', (done) => {
      service.getSettings().subscribe({
        next: () => done.fail('Should have failed with 401 error'),
        error: (error: SettingsError) => {
          expect(error.status).toBe(401);
          expect(error.code).toBe('SETTINGS_UNAUTHORIZED');
          expect(error.summary).toBe('Não autorizado');
          done();
        },
      });

      const req = httpMock.expectOne(SETTINGS_API_ENDPOINTS.settings());
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 404 not found error', (done) => {
      service.getSettings().subscribe({
        next: () => done.fail('Should have failed with 404 error'),
        error: (error: SettingsError) => {
          expect(error.status).toBe(404);
          expect(error.code).toBe('SETTINGS_NOT_FOUND');
          expect(error.summary).toBe('Configurações não encontradas');
          done();
        },
      });

      const req = httpMock.expectOne(SETTINGS_API_ENDPOINTS.settings());
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle 500 server error', (done) => {
      service.getSettings().subscribe({
        next: () => done.fail('Should have failed with 500 error'),
        error: (error: SettingsError) => {
          expect(error.status).toBe(500);
          expect(error.code).toBe('SETTINGS_SERVER_ERROR');
          expect(error.summary).toBe('Erro no servidor');
          done();
        },
      });

      const req = httpMock.expectOne(SETTINGS_API_ENDPOINTS.settings());
      req.flush(
        { message: 'Internal server error' },
        { status: 500, statusText: 'Internal Server Error' }
      );
    });
  });

  describe('updateSettings', () => {
    it('should update settings and normalize response', (done) => {
      const settingsToUpdate: UserSettings = {
        name: 'Jane Smith',
        theme: 'light',
        language: 'en-US',
        notificationsEnabled: false,
      };

      const mockApiResponse: UserSettingsApiResponse = {
        name: 'Jane Smith',
        theme: 'light',
        language: 'en-US',
        notifications_enabled: false,
      };

      service.updateSettings(settingsToUpdate).subscribe({
        next: (settings) => {
          expect(settings).toEqual(settingsToUpdate);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(SETTINGS_API_ENDPOINTS.settings());
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({
        name: 'Jane Smith',
        theme: 'light',
        language: 'en-US',
        notifications_enabled: false,
      });
      req.flush(mockApiResponse);
    });

    it('should handle 400 bad request error', (done) => {
      const settingsToUpdate: UserSettings = {
        name: '',
        theme: 'dark',
        language: 'pt-BR',
        notificationsEnabled: true,
      };

      service.updateSettings(settingsToUpdate).subscribe({
        next: () => done.fail('Should have failed with 400 error'),
        error: (error: SettingsError) => {
          expect(error.status).toBe(400);
          expect(error.code).toBe('SETTINGS_INVALID_DATA');
          expect(error.summary).toBe('Dados inválidos');
          done();
        },
      });

      const req = httpMock.expectOne(SETTINGS_API_ENDPOINTS.settings());
      req.flush(
        { message: 'Name is required' },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should handle 422 validation error', (done) => {
      const settingsToUpdate: UserSettings = {
        name: 'John Doe',
        theme: 'dark',
        language: 'pt-BR',
        notificationsEnabled: true,
      };

      service.updateSettings(settingsToUpdate).subscribe({
        next: () => done.fail('Should have failed with 422 error'),
        error: (error: SettingsError) => {
          expect(error.status).toBe(422);
          expect(error.code).toBe('SETTINGS_VALIDATION_ERROR');
          expect(error.summary).toBe('Erro de validação');
          done();
        },
      });

      const req = httpMock.expectOne(SETTINGS_API_ENDPOINTS.settings());
      req.flush(
        { message: 'Validation failed' },
        { status: 422, statusText: 'Unprocessable Entity' }
      );
    });

    it('should handle network errors', (done) => {
      const settingsToUpdate: UserSettings = {
        name: 'John Doe',
        theme: 'dark',
        language: 'pt-BR',
        notificationsEnabled: true,
      };

      service.updateSettings(settingsToUpdate).subscribe({
        next: () => done.fail('Should have failed with network error'),
        error: (error: SettingsError) => {
          expect(error.status).toBe(0);
          expect(error.code).toBe('SETTINGS_UNEXPECTED_ERROR');
          expect(error.summary).toBe('Erro inesperado');
          done();
        },
      });

      const req = httpMock.expectOne(SETTINGS_API_ENDPOINTS.settings());
      req.error(new ProgressEvent('error'));
    });
  });

  describe('normalization', () => {
    it('should correctly map snake_case API response to camelCase domain model', (done) => {
      const mockApiResponse: UserSettingsApiResponse = {
        name: 'Test User',
        theme: 'dark',
        language: 'pt-BR',
        notifications_enabled: true,
      };

      service.getSettings().subscribe({
        next: (settings) => {
          expect(settings.name).toBe('Test User');
          expect(settings.theme).toBe('dark');
          expect(settings.language).toBe('pt-BR');
          expect(settings.notificationsEnabled).toBe(true);
          expect((settings as any).notifications_enabled).toBeUndefined();
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(SETTINGS_API_ENDPOINTS.settings());
      req.flush(mockApiResponse);
    });

    it('should correctly map camelCase domain model to snake_case API request', (done) => {
      const settingsToUpdate: UserSettings = {
        name: 'Test User',
        theme: 'light',
        language: 'en-US',
        notificationsEnabled: false,
      };

      service.updateSettings(settingsToUpdate).subscribe({
        next: () => done(),
        error: done.fail,
      });

      const req = httpMock.expectOne(SETTINGS_API_ENDPOINTS.settings());
      expect(req.request.body.name).toBe('Test User');
      expect(req.request.body.theme).toBe('light');
      expect(req.request.body.language).toBe('en-US');
      expect(req.request.body.notifications_enabled).toBe(false);
      expect(req.request.body.notificationsEnabled).toBeUndefined();

      req.flush({
        name: 'Test User',
        theme: 'light',
        language: 'en-US',
        notifications_enabled: false,
      });
    });
  });
});
