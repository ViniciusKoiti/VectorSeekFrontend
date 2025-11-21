const path = require('path');

if (!process.env.CHROME_BIN && process.platform !== 'win32') {
  process.env.CHROME_BIN = 'chromium-browser';
}

const isCI = process.env.CI === 'true';

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage')
    ],
    client: {
      jasmine: {},
      clearContext: false
    },
    jasmineHtmlReporter: {
      suppressAll: true
    },
    coverageReporter: {
      dir: path.join(__dirname, './coverage/vectorseek-platform'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }]
    },
    reporters: ['progress', 'kjhtml'],
    port: 0,
    listenAddress: '127.0.0.1',
    hostname: 'localhost',
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: isCI ? ['ChromiumHeadlessNoSandbox'] : ['Chrome'],
    customLaunchers: {
      ChromiumHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-dev-shm-usage']
      }
    },
    singleRun: false,
    restartOnFileChange: true
  });
};
