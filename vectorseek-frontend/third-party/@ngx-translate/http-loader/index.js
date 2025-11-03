class TranslateHttpLoader {
  constructor(http, prefix = "", suffix = "") {
    this.http = http;
    this.prefix = prefix;
    this.suffix = suffix;
  }

  getTranslation(lang) {
    const path = `${this.prefix}${lang}${this.suffix}`;
    return Promise.resolve({ path });
  }
}

module.exports = {
  TranslateHttpLoader,
};
