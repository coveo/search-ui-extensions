/**
 * Supported languages.
 */
export type Language = 'en';

/**
 * JSON format of imported strings.json files.
 */
export interface ILanguageDictionary {
  [key: string]: string;
}

export class Translation {
  public static register(language: Language, values: ILanguageDictionary) {
    // @ts-ignore
    String.toLocaleString({
      [language]: values
    });
  }
}
