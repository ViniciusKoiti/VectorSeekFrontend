class FormControl {
  constructor(initialValue = null) {
    this.initialValue = initialValue;
    this.value = initialValue;
    this.disabled = false;
    this.touched = false;
    this.errors = null;
  }

  setValue(value) {
    this.value = value;
  }

  patchValue(value) {
    this.setValue(value);
  }

  reset(value = undefined) {
    if (value !== undefined) {
      this.initialValue = value;
      this.value = value;
    } else {
      this.value = this.initialValue;
    }
    this.touched = false;
    this.errors = null;
  }

  markAsTouched() {
    this.touched = true;
  }

  setErrors(errors) {
    this.errors = errors;
  }
}

class FormGroup {
  constructor(controls) {
    this.controls = controls || {};
    this.disabled = false;
  }

  get value() {
    const result = {};
    for (const key of Object.keys(this.controls)) {
      result[key] = this.controls[key].value;
    }
    return result;
  }

  getRawValue() {
    return this.value;
  }

  patchValue(values = {}) {
    for (const key of Object.keys(values)) {
      if (this.controls[key]) {
        this.controls[key].setValue(values[key]);
      }
    }
  }

  reset(values = undefined) {
    for (const key of Object.keys(this.controls)) {
      if (values && Object.prototype.hasOwnProperty.call(values, key)) {
        this.controls[key].reset(values[key]);
      } else {
        this.controls[key].reset();
      }
    }
  }

  disable() {
    this.disabled = true;
  }

  enable() {
    this.disabled = false;
  }
}

class FormBuilder {
  group(config) {
    const controls = {};
    for (const key of Object.keys(config)) {
      const value = config[key];
      if (value instanceof FormControl) {
        controls[key] = value;
      } else if (Array.isArray(value)) {
        controls[key] = new FormControl(value[0]);
      } else {
        controls[key] = new FormControl(value);
      }
    }
    return new FormGroup(controls);
  }

  control(value) {
    return new FormControl(value);
  }
}

class FormGroupDirective {
  constructor(form = null) {
    this.form = form;
    this.submitted = false;
  }

  resetForm(value) {
    if (this.form) {
      this.form.reset(value);
    }
    this.submitted = false;
  }
}

class ReactiveFormsModule {}
class FormsModule {}

module.exports = {
  FormBuilder,
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
  FormsModule,
};
