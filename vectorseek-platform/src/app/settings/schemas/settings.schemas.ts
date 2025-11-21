import { z } from 'zod';

/**
 * Schema for user settings form validation
 */
export const settingsSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'settings.errors.nameRequired' })
    .max(200, { message: 'settings.errors.nameMaxLength' }),
  theme: z.enum(['light', 'dark'], {
    errorMap: () => ({ message: 'settings.errors.invalidTheme' }),
  }),
  language: z.enum(['pt-BR', 'en-US'], {
    errorMap: () => ({ message: 'settings.errors.invalidLanguage' }),
  }),
  notificationsEnabled: z.boolean(),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
