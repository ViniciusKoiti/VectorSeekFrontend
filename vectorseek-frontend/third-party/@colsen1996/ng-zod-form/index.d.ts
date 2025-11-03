import type { z } from "../zod";

export interface NgZodForm<T> {
  schema: z.ZodType<T>;
  options: Record<string, unknown>;
  safeParse(value: unknown): { success: true; data: T } | { success: false; error: unknown };
}

export declare function createForm<T>(schema: z.ZodType<T>, options?: Record<string, unknown>): NgZodForm<T>;
export { z };
