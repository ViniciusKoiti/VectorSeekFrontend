import { z } from 'zod';
import { PlanType } from '../../../../libs/data-access/src/lib/auth/auth.models';

/**
 * Schema de validação para o formulário de login
 *
 * Alinhado com o contrato do backend e ADR-001
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'auth.login.errors.required' })
    .email({ message: 'auth.login.errors.email' }),
  password: z
    .string()
    .min(1, { message: 'auth.login.errors.required' })
    .min(6, { message: 'auth.login.errors.minLength' }),
  rememberMe: z.boolean().optional()
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Schema de validação para o formulário de registro
 *
 * Inclui validação de senha forte e aceitação de termos
 */
export const registerSchema = z.object({
  fullName: z
    .string()
    .min(1, { message: 'auth.register.errors.required' })
    .min(3, { message: 'auth.register.errors.fullNameMinLength' }),
  email: z
    .string()
    .min(1, { message: 'auth.register.errors.required' })
    .email({ message: 'auth.register.errors.email' }),
  password: z
    .string()
    .min(1, { message: 'auth.register.errors.required' })
    .min(8, { message: 'auth.register.errors.minLength' }),
  plan: z.nativeEnum(PlanType).default(PlanType.FREE),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, {
      message: 'auth.register.errors.acceptTerms'
    })
});

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Schema de validação para o formulário de recuperação de senha
 *
 * Solicita apenas o e-mail para envio do link mágico
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'auth.forgotPassword.errors.required' })
    .email({ message: 'auth.forgotPassword.errors.email' })
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
