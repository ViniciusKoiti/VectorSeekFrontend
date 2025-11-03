import { z } from '@colsen1996/ng-zod-form';
import type { RegisterRequest } from '@vectorseek/data-access/lib/auth/auth.models';

export const registerFormSchema: z.ZodType<RegisterRequest> = z.object({
  fullName: z
    .string({ required_error: 'auth.validation.fullName' })
    .min(1, 'auth.validation.fullName'),
  email: z
    .string({ required_error: 'auth.validation.required' })
    .email('auth.validation.email'),
  password: z
    .string({ required_error: 'auth.validation.required' })
    .min(8, 'auth.validation.passwordLength'),
  acceptTerms: z.boolean().true('auth.validation.acceptTerms')
});

export type RegisterFormSchema = typeof registerFormSchema;
