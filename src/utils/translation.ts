/**
 * Supported languages.
 */
export enum Language {
    English = 'en'
}

/**
 * JSON format of imported strings.json files.
 */
export default interface ILanguageDictionary {
    [key: string]: string;
}

/**
 * Translation utilities.
 */
export class Translation {
    /**
     * Register translations for a language.
     *
     * @param language Language of the dictionary.
     * @param translationDictionary Key-Value dictionary that contain all traslation for a language.
     */
    public static register(language: Language, translationDictionary: ILanguageDictionary) {
        Object.keys(translationDictionary).forEach(key => {
            String['locales'] = String['locales'] || {};
            String['locales'][language] = String['locales'][language] || {};
            String['locales'][language][key] = translationDictionary[key];
        });
        String['toLocaleString'].call(this, { [language]: String['locales'][language] });
    }
}
