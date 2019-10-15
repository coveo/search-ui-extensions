import { EndpointCaller, AccessToken, Assert, ISuccessResponse } from 'coveo-search-ui';

/**
 * Initialization options for **UserProfilingEndpoint**.
 */
export interface IUserProfilingEndpointOptions {
    /**
     * URI of the User Profiling Endpoint.
     *
     * Default: `https://platform.cloud.coveo.com`
     */
    uri?: string;

    /**
     * Search Token to query the endpoint.
     */
    accessToken: AccessToken;

    /**
     * Organization identifier of the organization.
     */
    organization: string;
}

/**
 * User Actions posible type.
 */
export enum UserActionType {
    Search = 'SEARCH',
    Click = 'CLICK',
    PageView = 'VIEW',
    Custom = 'CUSTOM'
}

/**
 * Pased Action History item format.
 */
export interface IActionHistory {
    /**
     * Type of the action.
     */
    name: UserActionType;

    /**
     * When the action was done.
     */
    time: number;

    /**
     * Value associated to an actions.
     */
    value: {
        [key: string]: string;
    };
}

/**
 * Expected format of the User Profiling service response.
 */
interface IActionsHistoryResponse {
    value: {
        name: string;
        time: string;
        value: string;
    }[];
    debug: any;
    internalExecutionLog: any;
    executionTime: number;
}

/**
 * Class that handle interaction with the endpoint.
 */
export class UserProfilingEndpoint {
    /**
     * Default platform uri.
     */
    public static readonly DEFAULT_URI = 'https://platform.cloud.coveo.com';

    private caller: EndpointCaller;

    /**
     * Create a `UserProfilingEndpoint` instance.
     * Create [`EndpointCaller`]{@link EndpointCaller} instance and uses it to communicate with the endpoint internally.
     *
     * @param options The options to initialize the component.
     */
    constructor(public options: IUserProfilingEndpointOptions) {
        Assert.exists(this.options.accessToken);
        Assert.exists(this.options.organization);

        this.options.uri = this.options.uri ? this.options.uri : UserProfilingEndpoint.DEFAULT_URI;

        this.options.accessToken.subscribeToRenewal(this.buildEndpointCaller.bind(this));
        this.buildEndpointCaller(this.options.accessToken.token);
    }

    private buildEndpointCaller(token: string) {
        this.caller = new EndpointCaller({ accessToken: token });
    }

    /**
     * Get the list of actions a user has performed.
     *
     * @param userId Id from which action history will be retrieve. (either visitId or user email).
     */
    public async getActions(userId: string): Promise<IActionHistory[]> {
        Assert.exists(userId);
        const response = await this.caller.call<IActionsHistoryResponse>({
            method: 'POST',
            url: `${this.options.uri}/rest/organizations/${this.options.organization}/machinelearning/user/actions`,
            queryString: [],
            responseType: 'json',
            requestDataType: 'application/json',
            requestData: { objectId: userId },
            errorsAsSuccess: false
        });

        if (this.isResponseEmpty(response)) {
            throw new Error(`Response has no values: ${JSON.stringify(response)}`);
        }

        return this.parseResponse(response.data);
    }

    private parseResponse(response: IActionsHistoryResponse) {
        return response.value.map(v => {
            return {
                time: parseInt(v.time),
                value: JSON.parse(v.value) as { [key: string]: string },
                name: v.name as UserActionType
            };
        });
    }

    private isResponseEmpty(response: ISuccessResponse<IActionsHistoryResponse>) {
        return !response || !response.data || !response.data.value || !Array.isArray(response.data.value) || !(response.data.value.length > 0);
    }
}
