import authPtBr from '../../assets/i18n/auth/pt-BR.json';
import authEnUs from '../../assets/i18n/auth/en-US.json';

export const AUTH_DEFAULT_LANGUAGE = 'pt-BR';

export type FlattenedTranslations = Record<string, string>;

function flattenTranslations(prefix: string, source: Record<string, unknown>, target: FlattenedTranslations): void {
  for (const [key, value] of Object.entries(source)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenTranslations(nextKey, value as Record<string, unknown>, target);
    } else if (typeof value === 'string') {
      target[nextKey] = value;
    }
  }
}

function buildTranslations(raw: Record<string, unknown>): FlattenedTranslations {
  const target: FlattenedTranslations = {};
  const authBlock = raw['auth'];
  if (authBlock && typeof authBlock === 'object') {
    flattenTranslations('auth', authBlock as Record<string, unknown>, target);
  }
  return target;
}

export const AUTH_TRANSLATIONS: Record<string, FlattenedTranslations> = {
  'pt-BR': buildTranslations(authPtBr as Record<string, unknown>),
  'en-US': buildTranslations(authEnUs as Record<string, unknown>)
};
