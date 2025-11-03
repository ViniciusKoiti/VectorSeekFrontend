import { z } from '@colsen1996/ng-zod-form';
import type { LoginRequest } from '@vectorseek/data-access/lib/auth/auth.models';

export const loginFormSchema: z.ZodType<LoginRequest> = z.object({
  email: z
    .string({ required_error: 'auth.validation.required' })
    .email('auth.validation.email'),
  password: z
    .string({ required_error: 'auth.validation.required' })
    .min(8, 'auth.validation.passwordLength'),
  rememberMe: z.boolean().optional()
});

export type LoginFormSchema = typeof loginFormSchema;
