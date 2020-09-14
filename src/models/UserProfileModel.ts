import { Model, QueryBuilder, IQueryResult, AccessToken, Assert, ISearchEndpoint, SearchEndpoint } from 'coveo-search-ui';
import { UserProfilingEndpoint, IActionHistory, UserActionType } from '../rest/UserProfilingEndpoint';

/**
 * Represent an action that a user has made.
 */
export class UserAction {
    constructor(
        public type: UserActionType,
        public timestamp: Date,
        public raw: {
            [key: string]: string;
            query_expression?: string;
            uri_hash?: string;
            event_type?: string;
            event_value?: string;
            origin_level_1?: string;
            cause?: string;
            content_id_key?: string;
            content_id_value?: string;
        },
        public document?: IQueryResult,
        public query?: string
    ) {}
}

/**
 * Initialization options of the **UserProfileModel** class.
 */
export interface IUserProfileModelOptions {
    searchEndpoint: ISearchEndpoint;

    /**
     * Search token to access the organization.
     */
    accessToken?: AccessToken;

    /**
     * Organization id of the organizatrion.
     */
    organizationId: string;

    /**
     * Uri of the User Profiling Endpoint.
     */
    restUri: string;
}

/**
 * Model that store each user profile informations such as actions made by them,
 */
export class UserProfileModel extends Model {
    /**
     * Identifier of the Search-UI component.
     */
    public static readonly ID = 'UserProfileModel';

    private static readonly ERROR_MESSAGE = Object.freeze({
        FETCH_CLICKED_DOCUMENT_FAIL: 'Fetching clicked documents details failed',
    });

    private static readonly MODEL_CONFIG = {
        customAttribute: true,
        silent: true,
    };

    private endpoint: UserProfilingEndpoint;
    private getOrFetchCache: { [userId: string]: Promise<UserAction[]> };

    /**
     * Create a `UserProfileModel` and bound it to `element`.
     * Also create a `UserProfilingEndpoint` that will be use to fetch actions made by a user.
     *
     * @param element An element on which the model will be bound on.
     * @param options A set of options necessary for the component creation.
     */
    constructor(element: HTMLElement, public options: IUserProfileModelOptions) {
        super(element, UserProfileModel.ID, {});
        Assert.isNotUndefined(this.options.restUri);
        Assert.isNotUndefined(this.options.organizationId);
        Assert.isNotUndefined(this.options.searchEndpoint);

        this.getOrFetchCache = {};

        this.endpoint = new UserProfilingEndpoint({
            uri: this.options.restUri,
            accessToken: this.options.accessToken || (this.options.searchEndpoint as SearchEndpoint).accessToken,
            organization: this.options.organizationId,
        });
    }

    /**
     * Get all actions related to a user.
     *
     * @param userId The identifier of a user.
     */
    public async getActions(userId: string, onDocumentFetch?: (query: QueryBuilder) => void): Promise<UserAction[]> {
        let actions = <UserAction[]>this.get(userId);
        actions = Array.isArray(actions) ? actions : await this.fetchActions(userId, onDocumentFetch);

        this.set(userId, actions, UserProfileModel.MODEL_CONFIG);

        return actions;
    }

    /**
     * Delete all actions related to a user from the model.
     *
     * @param userId The identifier of a user.
     */
    public deleteActions(userId: string) {
        this.set(userId, undefined, UserProfileModel.MODEL_CONFIG);
        this.getOrFetchCache[userId] = undefined;
    }

    private fetchActions(userId: string, onDocumentFetch?: (query: QueryBuilder) => void) {
        const pendingFetch = this.getOrFetchCache[userId];
        const doFetch = () => {
            this.getOrFetchCache[userId] = this.endpoint
                .getActions(userId)
                .then((actions) => this.parseGetActionsResponse(userId, actions, onDocumentFetch));
            return this.getOrFetchCache[userId];
        };
        return pendingFetch || doFetch();
    }

    private parseGetActionsResponse(
        userId: string,
        actions: IActionHistory[],
        onDocumentFetch?: (query: QueryBuilder) => void
    ): Promise<UserAction[]> {
        const userActions = this.buildUserActions(actions, onDocumentFetch);

        this.registerNewAttribute(userId, userActions);

        return userActions;
    }

    private async fetchDocuments(urihashes: string[], onDocumentFetch?: (query: QueryBuilder) => void): Promise<{ [urihash: string]: IQueryResult }> {
        if (urihashes.length === 0) {
            return Promise.resolve({});
        }

        const query = new QueryBuilder();
        query.advancedExpression.addFieldExpression(
            '@urihash',
            '==',
            urihashes.filter((x) => x)
        );

        // Ensure we fetch the good amount of document.
        query.numberOfResults = urihashes.length;

        // Let some component perform action before the fetch occur such as log events.
        if (onDocumentFetch) {
            onDocumentFetch(query);
        }

        // Here we directly use the Search Endpoint to query without side effects.
        const searchRequest = await this.options.searchEndpoint.search(query.build());

        const documentsDict = searchRequest.results.reduce((acc, result) => ({ ...acc, [result.raw.urihash]: result }), {});

        return documentsDict;
    }

    private async buildUserActions(actions: IActionHistory[], onDocumentFetch: (query: QueryBuilder) => void): Promise<UserAction[]> {
        let documents = {} as { [urihash: string]: IQueryResult };

        const urihashes = actions
            .filter(this.isClick)
            .map((action) => action.value.uri_hash)
            // Remove duplicates.
            .filter((value, index, list) => list.indexOf(value) === index);

        try {
            documents = await this.fetchDocuments(urihashes, onDocumentFetch);
        } catch (error) {
            this.logger.error(UserProfileModel.ERROR_MESSAGE.FETCH_CLICKED_DOCUMENT_FAIL, error);
        }

        return actions.map((action) => {
            return new UserAction(
                action.name,
                new Date(action.time),
                action.value,
                this.isClickOrView(action) ? documents[action.value.uri_hash] : undefined,
                this.isSearch(action) ? action.value.query_expression : undefined
            );
        });
    }

    private isClick(action: IActionHistory) {
        return action.name === UserActionType.Click;
    }

    private isClickOrView(action: IActionHistory) {
        return this.isClick(action) || action.name === UserActionType.PageView;
    }

    private isSearch(action: IActionHistory) {
        return action.name === UserActionType.Search;
    }
}

/**
 * Expose the UserProfileModel so a user action implementation can use it.
 */
(window as any)['Coveo'] && ((window as any)['Coveo']['UserProfileModel'] = UserProfileModel);
