import { buildSearchInterfaceWithResults } from '../utils';
import { InitializationUtils } from '../../src/utils/initialization';
import { UserProfileModel } from '../../src/models/UserProfileModel';
import { Logger, get } from 'coveo-search-ui';

describe('InitializationUtils', () => {
    beforeAll(() => {
        Logger.disable();
    });

    afterAll(() => {
        Logger.enable();
    });

    describe('getUserProfileModel', () => {
        it('should return the UserProfileModel when available', () => {
            const searchInterface = buildSearchInterfaceWithResults();
            const element = document.createElement('div');
            const existingModel = new UserProfileModel(
                element,
                {},
                { searchInterface: searchInterface, queryController: searchInterface.queryController }
            );
            (element as any)['UserProfileModel'] = existingModel;

            const model = InitializationUtils.getUserProfileModel(element, {
                searchInterface: searchInterface,
                queryController: searchInterface.queryController
            });

            expect(model).toBe(existingModel);
        });

        it('should create a UserProfileModel and attach it the element when there is no UserProfileModel', () => {
            const searchInterface = buildSearchInterfaceWithResults();
            const element = document.createElement('div');

            const model = InitializationUtils.getUserProfileModel(element, {
                searchInterface: searchInterface,
                queryController: searchInterface.queryController
            });

            expect(model).not.toBeUndefined();
            expect(model.bindings.searchInterface).toBe(searchInterface);
            expect(get(element, UserProfileModel, true)).toBe(model);
        });
    });
});
