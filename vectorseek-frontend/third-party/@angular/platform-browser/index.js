const core = require("@angular/core");

exports.bootstrapApplication = function bootstrapApplication(rootComponent, options) {
  return Promise.resolve({
    rootComponent,
    options,
    destroy() {},
  });
};

exports.BrowserModule = class BrowserModule {};
exports.BrowserAnimationsModule = class BrowserAnimationsModule {};
exports.provideClientHydration = function provideClientHydration() {
  return [];
};
exports.ɵɵdefineApplication = function defineApplication(config) {
  return config;
};
exports.ApplicationConfig = class ApplicationConfig {};
exports.provideZoneChangeDetection = function provideZoneChangeDetection() {
  return [];
};
exports.platformBrowser = function platformBrowser() {
  return {
    bootstrapModule: function bootstrapModule(module) {
      return Promise.resolve(module);
    }
  };
};

exports.VERSION = core.VERSION;
