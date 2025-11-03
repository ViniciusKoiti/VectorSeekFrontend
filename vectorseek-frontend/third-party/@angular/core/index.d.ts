export interface Signal<T> {
  value: T;
  set(value: T): void;
  update(mutator: (value: T) => T): void;
}

export declare function Component(metadata: Record<string, unknown>): ClassDecorator;
export declare function Injectable(metadata?: Record<string, unknown>): ClassDecorator;
export declare function Pipe(metadata: Record<string, unknown>): ClassDecorator;
export declare function NgModule(metadata: Record<string, unknown>): ClassDecorator;
export declare function Input(metadata?: Record<string, unknown>): PropertyDecorator;
export declare function Output(metadata?: Record<string, unknown>): PropertyDecorator;
export declare function ViewChild(selector: unknown): PropertyDecorator;
export declare function ViewChildren(selector: unknown): PropertyDecorator;
export declare function ContentChild(selector: unknown): PropertyDecorator;
export declare function ContentChildren(selector: unknown): PropertyDecorator;
export declare function signal<T>(initial: T): Signal<T>;
export declare function effect(effectFn: () => void): void;
export declare function computed<T>(factory: () => T): T;
export declare function inject<T = unknown>(): T;
export declare const VERSION: { full: string };
