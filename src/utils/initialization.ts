import { get, Assert, SearchInterface } from 'coveo-search-ui';
import { UserProfileModel } from '../models/UserProfileModel';

export class InitializationUtils {
  public static getUserProfileModel(element: HTMLElement, searchInterface: SearchInterface) {
    Assert.exists(element);
    Assert.exists(searchInterface);

    let userProfileModel = get(element, UserProfileModel, true) as UserProfileModel;
    if (!userProfileModel) {
      userProfileModel = new UserProfileModel(element, {
        searchInterface: searchInterface
      });
    }
    return userProfileModel;
  }
}
