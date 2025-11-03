export declare class TranslateHttpLoader {
  constructor(http: unknown, prefix?: string, suffix?: string);
  http: unknown;
  prefix: string;
  suffix: string;
  getTranslation(lang: string): Promise<{ path: string }>;
}
