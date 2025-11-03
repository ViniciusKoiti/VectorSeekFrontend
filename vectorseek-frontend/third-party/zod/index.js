class ZodError extends Error {
  constructor(issues) {
    super('Validation failed');
    this.issues = issues;
  }
}

class ZodType {
  optional() {
    return new ZodOptional(this);
  }
}

class ZodString extends ZodType {
  constructor(config = {}) {
    super();
    this._checks = [];
    this._config = {
      required_error: config.required_error || 'Expected string'
    };
  }

  email(message = 'Invalid email address') {
    this._checks.push({ type: 'email', message });
    return this;
  }

  min(length, message) {
    this._checks.push({ type: 'min', length, message: message || `Must be at least ${length} characters` });
    return this;
  }

  parse(value, path = []) {
    const issues = [];

    if (value === undefined || value === null || value === '') {
      issues.push({ path, message: this._config.required_error });
    } else if (typeof value !== 'string') {
      issues.push({ path, message: 'Expected string' });
    } else {
      for (const check of this._checks) {
        if (check.type === 'min' && value.length < check.length) {
          issues.push({ path, message: check.message });
        }
        if (check.type === 'email') {
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(value)) {
            issues.push({ path, message: check.message });
          }
        }
      }
    }

    if (issues.length) {
      throw new ZodError(issues);
    }

    return typeof value === 'string' ? value : '';
  }
}

class ZodBoolean extends ZodType {
  constructor() {
    super();
    this._checks = [];
  }

  true(message = 'Expected true') {
    this._checks.push({ type: 'true', message });
    return this;
  }

  parse(value, path = []) {
    if (value === undefined || value === null) {
      value = false;
    }
    if (typeof value !== 'boolean') {
      throw new ZodError([{ path, message: 'Expected boolean' }]);
    }

    const issues = [];
    for (const check of this._checks) {
      if (check.type === 'true' && value !== true) {
        issues.push({ path, message: check.message });
      }
    }

    if (issues.length) {
      throw new ZodError(issues);
    }

    return value;
  }
}

class ZodOptional extends ZodType {
  constructor(inner) {
    super();
    this.inner = inner;
  }

  parse(value, path = []) {
    if (value === undefined || value === null) {
      return undefined;
    }
    return this.inner.parse(value, path);
  }
}

class ZodObject extends ZodType {
  constructor(shape) {
    super();
    this.shape = shape || {};
  }

  parse(value, path = []) {
    if (typeof value !== 'object' || value === null) {
      throw new ZodError([{ path, message: 'Expected object' }]);
    }

    const result = {};
    const issues = [];

    for (const key of Object.keys(this.shape)) {
      const parser = this.shape[key];
      try {
        result[key] = parser.parse(value[key], [...path, key]);
      } catch (error) {
        if (error instanceof ZodError) {
          issues.push(...error.issues);
        } else {
          issues.push({ path: [...path, key], message: 'Invalid value' });
        }
      }
    }

    if (issues.length) {
      throw new ZodError(issues);
    }

    return result;
  }
}

function string(config) {
  return new ZodString(config);
}

function boolean() {
  return new ZodBoolean();
}

function object(shape) {
  return new ZodObject(shape);
}

module.exports = {
  ZodError,
  ZodType,
  ZodString,
  ZodBoolean,
  ZodObject,
  ZodOptional,
  string,
  boolean,
  object,
  z: {
    string,
    boolean,
    object,
    ZodError,
  },
};
