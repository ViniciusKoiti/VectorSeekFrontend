export declare function configure(loader: () => void, module: unknown): void;
export declare function storiesOf(name: string, module: unknown): { add(story: string, impl: () => unknown): unknown };
export declare function addParameters(params: Record<string, unknown>): void;
