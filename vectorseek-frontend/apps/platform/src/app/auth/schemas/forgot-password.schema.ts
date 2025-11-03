import { z } from '@colsen1996/ng-zod-form';
import type { RequestMagicLinkRequest } from '@vectorseek/data-access/lib/auth/auth.models';

export const forgotPasswordSchema: z.ZodType<RequestMagicLinkRequest> = z.object({
  email: z
    .string({ required_error: 'auth.validation.required' })
    .email('auth.validation.email'),
  redirectUrl: z.string().optional(),
  locale: z.string().optional()
});

export type ForgotPasswordSchema = typeof forgotPasswordSchema;
