import { Translation, Language } from '../../src/utils/translation';

describe('Translation', () => {
    describe('register', () => {
        it('should register each translation in the String locales', () => {
            const dict = {
                1: 'someTest1',
                2: ''
            };
            Translation.register(Language.English, dict);

            Object.keys(dict).forEach(key => {
                expect(String['locales'][Language.English][key]).toBe(dict[key]);
                expect(key.toLocaleString()).toBe(dict[key]);
            });
            expect(String['locales'][Language.English][3]).toBe(undefined);
        });

        it('should enable toLocaleString for each registered strings', () => {
            const dict = {
                1: 'someTest1',
                2: ''
            };
            Translation.register(Language.English, dict);

            Object.keys(dict).forEach(key => {
                expect(key.toLocaleString()).toBe(dict[key]);
            });
            expect('3'.toLocaleString()).toBe('3');
        });
    });
});
