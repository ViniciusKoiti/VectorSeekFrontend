import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { provideTranslateService, TranslateLoader as TranslateLoaderService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { provideMarkdown } from 'ngx-markdown';

import { routes } from './app.routes';
import ptBR from '../assets/i18n/pt-BR.json';

/**
 * Loader customizado para traduções
 * Carrega arquivos de tradução staticamente
 */
export class CustomTranslateLoader implements TranslateLoaderService {
  getTranslation(lang: string) {
    // Para produção, poderia carregar dinamicamente via HttpClient
    // Por enquanto, retorna o JSON importado estaticamente
    if (lang === 'pt-BR') {
      return of(ptBR);
    }
    return of({});
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    provideRouter(routes),
    provideAnimations(),
    provideMarkdown(),
    provideTranslateService({
      defaultLanguage: 'pt-BR',
      loader: {
        provide: TranslateLoader,
        useClass: CustomTranslateLoader
      }
    })
  ]
};
