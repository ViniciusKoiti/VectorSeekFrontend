import { z } from 'zod';

/**
 * Schemas de validação com Zod para formulários de geração
 * Conforme especificação E3-A1
 */

// Schema para o primeiro step (Form)
export const formStepSchema = z.object({
  title: z
    .string()
    .min(3, 'O título deve ter pelo menos 3 caracteres')
    .max(100, 'O título deve ter no máximo 100 caracteres'),
  briefing: z
    .string()
    .min(10, 'O briefing deve ter pelo menos 10 caracteres')
    .max(5000, 'O briefing deve ter no máximo 5000 caracteres'),
  modelOverride: z.string().optional()
});

export type FormStepData = z.infer<typeof formStepSchema>;

// Schema para o segundo step (Template)
export const templateStepSchema = z.object({
  templateId: z.string().min(1, 'Selecione um template'),
  customVariables: z.record(z.union([z.string(), z.number()])).optional()
});

export type TemplateStepData = z.infer<typeof templateStepSchema>;

// Schema completo do wizard
export const wizardSchema = z.object({
  title: z.string().min(3).max(100),
  briefing: z.string().min(10).max(5000),
  templateId: z.string().min(1),
  customVariables: z.record(z.union([z.string(), z.number()])).optional(),
  modelOverride: z.string().optional()
});

export type WizardData = z.infer<typeof wizardSchema>;

/**
 * Helper para validar dados com Zod e retornar erros amigáveis
 */
export function validateWithZod<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });

  return { success: false, errors };
}

/**
 * Helper para validar variáveis customizadas de templates
 */
export function validateTemplateVariables(
  variables: Array<{ name: string; required: boolean; type: string }>,
  values: Record<string, string | number>
): Record<string, string> {
  const errors: Record<string, string> = {};

  variables.forEach((variable) => {
    if (variable.required && !values[variable.name]) {
      errors[variable.name] = `${variable.name} é obrigatório`;
    }

    if (values[variable.name] !== undefined) {
      const value = values[variable.name];

      if (variable.type === 'number') {
        if (typeof value !== 'number' && isNaN(Number(value))) {
          errors[variable.name] = `${variable.name} deve ser um número`;
        }
      }

      if (variable.type === 'text' || variable.type === 'textarea') {
        if (typeof value !== 'string') {
          errors[variable.name] = `${variable.name} deve ser texto`;
        }
      }
    }
  });

  return errors;
}
