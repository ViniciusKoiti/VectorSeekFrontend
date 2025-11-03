exports.bootstrapApplication = function bootstrapApplication(component, options) {
  return Promise.resolve({
    render: () => Promise.resolve(`<app-root>${component.name || "Component"}</app-root>`),
    component,
    options,
  });
};

exports.renderModule = function renderModule(module, options) {
  return Promise.resolve(`<app-root>${module.name || "Module"}</app-root>`);
};

exports.provideServerRendering = function provideServerRendering() {
  return [];
};
