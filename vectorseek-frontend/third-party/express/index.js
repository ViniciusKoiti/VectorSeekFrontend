function createApp() {
  const routes = [];
  const app = function handler(req, res) {
    const route = routes.find((r) => r.path === req.url);
    if (route) {
      route.handler(req, res);
    } else {
      res.statusCode = 404;
      res.end("Not Found");
    }
  };

  app.get = function get(path, handler) {
    routes.push({ method: "GET", path, handler });
    return app;
  };

  app.use = function use() {
    return app;
  };

  app.set = function set() {
    return app;
  };

  app.listen = function listen(port, callback) {
    if (callback) {
      callback();
    }
    return {
      close() {},
      port,
    };
  };

  return app;
}

module.exports = createApp;
module.exports.Router = function Router() {
  return { get() {}, use() {} };
};
module.exports.json = function json() {
  return (req, res, next) => next && next();
};
module.exports.urlencoded = function urlencoded() {
  return (req, res, next) => next && next();
};
