import type { ApplicationConfig } from "@angular/core";

export declare function bootstrapApplication(component: unknown, options?: unknown): Promise<unknown>;
export declare class BrowserModule {}
export declare class BrowserAnimationsModule {}
export declare function provideClientHydration(): unknown;
export declare function ɵɵdefineApplication(config: ApplicationConfig): ApplicationConfig;
export declare function provideZoneChangeDetection(): unknown;
export declare function platformBrowser(): { bootstrapModule(module: unknown): Promise<unknown> };
export declare const VERSION: { full: string };
