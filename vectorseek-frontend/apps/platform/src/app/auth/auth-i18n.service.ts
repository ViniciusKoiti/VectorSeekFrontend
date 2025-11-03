import { TranslateService } from '@ngx-translate/core';
import { AUTH_DEFAULT_LANGUAGE, AUTH_TRANSLATIONS } from './translations';

export class AuthI18nService {
  private initialized = false;

  constructor(private readonly translate: TranslateService) {}

  ensureLoaded(): void {
    if (this.initialized) {
      return;
    }

    for (const [language, translations] of Object.entries(AUTH_TRANSLATIONS)) {
      this.translate.setTranslation(language, translations, true);
    }

    this.translate.use(AUTH_DEFAULT_LANGUAGE);
    this.initialized = true;
  }
}
