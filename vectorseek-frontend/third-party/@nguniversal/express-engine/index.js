exports.ngExpressEngine = function ngExpressEngine() {
  return function render(options, callback) {
    const html = "<!doctype html><html><head></head><body><app-root>Universal</app-root></body></html>";
    callback(null, html);
  };
};
