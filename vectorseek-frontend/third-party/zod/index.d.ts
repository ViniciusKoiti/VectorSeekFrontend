export namespace z {
  class ZodString {
    email(): ZodString;
    min(length: number): ZodString;
    parse(value: unknown): string;
  }

  class ZodObject<T extends Record<string, unknown>> {
    constructor(shape: { [K in keyof T]: ZodType<T[K]> });
    parse(value: unknown): T;
  }

  type ZodType<T> = {
    parse(value: unknown): T;
  };

  function string(): ZodString;
  function object<T extends Record<string, unknown>>(shape: { [K in keyof T]: ZodType<T[K]> }): ZodObject<T>;
}

export import ZodString = z.ZodString;
export import ZodObject = z.ZodObject;
export import ZodType = z.ZodType;
export const string: typeof z.string;
export const object: typeof z.object;
