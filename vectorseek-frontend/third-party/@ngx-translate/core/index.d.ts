export declare class TranslateModule {}
export declare class TranslateLoader {}
export declare class TranslatePipe {}
export declare class TranslateService {
  currentLang: string;
  translations: Record<string, Record<string, string>>;
  use(lang: string): Promise<string>;
  setTranslation(lang: string, translations: Record<string, string>, merge?: boolean): void;
  instant(key: string): string;
}
export declare function provideTranslate(options: unknown): unknown;
