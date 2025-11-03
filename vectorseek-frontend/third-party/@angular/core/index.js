function decorator() {
  return function identity(target) {
    return target;
  };
}

function noop() {}

function createSignal(initial) {
  let value = initial;
  return {
    get value() {
      return value;
    },
    set value(newValue) {
      value = newValue;
    },
    set(newValue) {
      value = newValue;
    },
    update(mutator) {
      value = mutator(value);
    }
  };
}

exports.Component = decorator;
exports.Injectable = decorator;
exports.Pipe = decorator;
exports.NgModule = decorator;
exports.Input = decorator;
exports.Output = decorator;
exports.ViewChild = decorator;
exports.ViewChildren = decorator;
exports.ContentChild = decorator;
exports.ContentChildren = decorator;
exports.signal = createSignal;
exports.effect = noop;
exports.computed = function computed(factory) {
  return factory();
};
exports.inject = function inject() {
  return {};
};
exports.VERSION = { full: "0.0.0-mock" };
