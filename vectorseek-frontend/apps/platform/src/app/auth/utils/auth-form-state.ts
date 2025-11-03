import type { AuthError } from '@vectorseek/data-access/lib/auth/auth.models';

export interface AuthFormState {
  loading: boolean;
  success: boolean;
  error: AuthError | null;
  successMessage: string | null;
}

export const INITIAL_FORM_STATE: AuthFormState = {
  loading: false,
  success: false,
  error: null,
  successMessage: null
};

export function createInitialState(): AuthFormState {
  return { ...INITIAL_FORM_STATE };
}
