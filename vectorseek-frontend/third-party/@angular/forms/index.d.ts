export declare class FormControl<T = unknown> {
  value: T;
  disabled: boolean;
  touched: boolean;
  errors: Record<string, unknown> | null;
  constructor(initialValue?: T);
  setValue(value: T): void;
  patchValue(value: T): void;
  reset(value?: T): void;
  markAsTouched(): void;
  setErrors(errors: Record<string, unknown> | null): void;
}

export declare class FormGroup<T extends Record<string, any> = Record<string, any>> {
  controls: { [K in keyof T]: FormControl<T[K]> };
  disabled: boolean;
  constructor(controls: { [K in keyof T]: FormControl<T[K]> });
  readonly value: T;
  getRawValue(): T;
  patchValue(values: Partial<T>): void;
  reset(values?: Partial<T>): void;
  disable(): void;
  enable(): void;
}

export declare class FormBuilder {
  group<T extends Record<string, any>>(config: { [K in keyof T]: FormControl<T[K]> | [T[K]] | T[K] }): FormGroup<T>;
  control<T>(value: T): FormControl<T>;
}

export declare class FormGroupDirective<T extends Record<string, any> = Record<string, any>> {
  form: FormGroup<T> | null;
  submitted: boolean;
  constructor(form?: FormGroup<T> | null);
  resetForm(value?: Partial<T>): void;
}

export declare class ReactiveFormsModule {}
export declare class FormsModule {}
