class TranslateService {
  constructor() {
    this.currentLang = "en";
    this.translations = { en: {} };
  }

  use(lang) {
    this.currentLang = lang;
    return Promise.resolve(lang);
  }

  setTranslation(lang, translations, merge = false) {
    if (!merge || !this.translations[lang]) {
      this.translations[lang] = { ...translations };
    } else {
      this.translations[lang] = { ...this.translations[lang], ...translations };
    }
  }

  instant(key) {
    const langPack = this.translations[this.currentLang] || {};
    return langPack[key] || key;
  }
}

class TranslateModule {}

function TranslatePipe() {}

function TranslateLoader() {}

function provideTranslate(options) {
  return options || {};
}

module.exports = {
  TranslateModule,
  TranslateService,
  TranslateLoader,
  TranslatePipe,
  provideTranslate,
};
