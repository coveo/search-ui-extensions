import { get, Assert, IComponentBindings } from 'coveo-search-ui';
import { UserProfileModel } from '../models/UserProfileModel';

/**
 * Initialization utility functions container.
 */
export class InitializationUtils {
    /**
     * Get of Initialize the User Profile Model.
     *
     * @param root Element on which to bind the **UserProfileModel**.
     * @param bindings Bindings of the Search-UI framework environment.
     */
    public static getUserProfileModel(root: HTMLElement, bindings: IComponentBindings) {
        Assert.exists(root);
        Assert.exists(bindings);

        let userProfileModel = get(root, UserProfileModel, true) as UserProfileModel;
        if (!userProfileModel) {
            userProfileModel = new UserProfileModel(root, {}, bindings);
        }
        return userProfileModel;
    }
}
