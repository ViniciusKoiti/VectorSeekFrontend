import { z } from '@colsen1996/ng-zod-form';
import type { AuthError } from '@vectorseek/data-access/lib/auth/auth.models';
import type { TranslateService } from '@ngx-translate/core';

export type FieldErrors = Record<string, string[]>;

export function mergeFieldErrors(...sources: FieldErrors[]): FieldErrors {
  const result: FieldErrors = {};

  for (const source of sources) {
    for (const key of Object.keys(source)) {
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(...source[key]);
    }
  }

  return result;
}

export function mapZodError(error: unknown): FieldErrors {
  if (!error || typeof error !== 'object') {
    return {};
  }

  const ZodErrorCtor = (z as unknown as { ZodError: new (...args: any[]) => { issues: { path: (string | number)[]; message: string }[] } }).ZodError;

  if (!(error instanceof ZodErrorCtor)) {
    return {};
  }

  const issues = (error as { issues: { path: (string | number)[]; message: string }[] }).issues || [];
  const result: FieldErrors = {};

  for (const issue of issues) {
    const path = issue.path && issue.path.length > 0 ? issue.path[0] : 'form';
    const key = String(path);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(issue.message);
  }

  return result;
}

export function mapAuthFieldErrors(error: AuthError | null | undefined): FieldErrors {
  if (!error || !error.fieldErrors) {
    return {};
  }

  const result: FieldErrors = {};
  for (const key of Object.keys(error.fieldErrors)) {
    const messages = error.fieldErrors[key];
    result[key] = Array.isArray(messages) ? [...messages.map(String)] : [String(messages)];
  }
  return result;
}

export function translateFieldErrors(translate: TranslateService, errors: FieldErrors): FieldErrors {
  const result: FieldErrors = {};
  for (const key of Object.keys(errors)) {
    result[key] = errors[key].map((message) => translate.instant(message));
  }
  return result;
}
