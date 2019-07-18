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
      const el = document.createElement('div');
      const existingModel = new UserProfileModel(el, { searchInterface: searchInterface });
      (el as any)['UserProfileModel'] = existingModel;

      const model = InitializationUtils.getUserProfileModel(el, searchInterface);

      expect(model).toBe(existingModel);
    });

    it('should create a UserProfileModel and attach it the element when there is no UserProfileModel', () => {
      const searchInterface = buildSearchInterfaceWithResults();
      const el = document.createElement('div');

      const model = InitializationUtils.getUserProfileModel(el, searchInterface);

      expect(model).not.toBeUndefined();
      expect(model.options.searchInterface).toBe(searchInterface);
      expect(get(el, UserProfileModel, true)).toBe(model);
    });
  });
});
