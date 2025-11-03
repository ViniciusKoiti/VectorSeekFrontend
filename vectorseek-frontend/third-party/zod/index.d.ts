export interface ZodIssue {
  path: (string | number)[];
  message: string;
}

export declare class ZodError extends Error {
  issues: ZodIssue[];
  constructor(issues: ZodIssue[]);
}

export declare class ZodType<T = unknown> {
  optional(): ZodOptional<T>;
  parse(value: unknown, path?: (string | number)[]): T;
}

export declare class ZodString extends ZodType<string> {
  constructor(config?: { required_error?: string });
  email(message?: string): ZodString;
  min(length: number, message?: string): ZodString;
}

export declare class ZodBoolean extends ZodType<boolean> {
  true(message?: string): ZodBoolean;
}

export declare class ZodOptional<T> extends ZodType<T | undefined> {
  constructor(inner: ZodType<T>);
}

export declare class ZodObject<T extends Record<string, any>> extends ZodType<T> {
  constructor(shape: { [K in keyof T]: ZodType<T[K]> });
}

export declare namespace z {
  type ZodType<T> = import('./index').ZodType<T>;
  type ZodString = import('./index').ZodString;
  type ZodBoolean = import('./index').ZodBoolean;
  type ZodObject<T extends Record<string, any>> = import('./index').ZodObject<T>;
  type ZodOptional<T> = import('./index').ZodOptional<T>;

  function string(config?: { required_error?: string }): ZodString;
  function boolean(): ZodBoolean;
  function object<T extends Record<string, any>>(shape: { [K in keyof T]: ZodType<T[K]> }): ZodObject<T>;
}

export import ZodType = z.ZodType;
export import ZodString = z.ZodString;
export import ZodBoolean = z.ZodBoolean;
export import ZodObject = z.ZodObject;
export import ZodOptional = z.ZodOptional;
export import ZodIssue = ZodIssue;
export import ZodError = ZodError;
export declare const string: typeof z.string;
export declare const boolean: typeof z.boolean;
export declare const object: typeof z.object;
export declare const z: {
  string: typeof z.string;
  boolean: typeof z.boolean;
  object: typeof z.object;
  ZodError: typeof ZodError;
};
