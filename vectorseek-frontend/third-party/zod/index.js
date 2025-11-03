class ZodString {
  constructor() {
    this._checks = [];
  }

  email() {
    this._checks.push({ type: "email" });
    return this;
  }

  min(length) {
    this._checks.push({ type: "min", length });
    return this;
  }

  parse(value) {
    if (typeof value !== "string") {
      throw new Error("Expected string");
    }
    return value;
  }
}

class ZodObject {
  constructor(shape) {
    this.shape = shape;
  }

  parse(value) {
    if (typeof value !== "object" || value === null) {
      throw new Error("Expected object");
    }
    const result = {};
    for (const key of Object.keys(this.shape)) {
      result[key] = this.shape[key].parse(value[key]);
    }
    return result;
  }
}

function string() {
  return new ZodString();
}

function object(shape) {
  return new ZodObject(shape);
}

exports.ZodString = ZodString;
exports.ZodObject = ZodObject;
exports.string = string;
exports.object = object;
exports.z = {
  string,
  object,
};

exports.default = exports;
