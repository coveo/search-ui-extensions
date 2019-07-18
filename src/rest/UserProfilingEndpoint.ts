import { EndpointCaller, AccessToken, Assert, ISuccessResponse } from 'coveo-search-ui';

export interface IUserProfilingEndpointOptions {
  uri?: string;
  accessToken: AccessToken;
  organization: string;
}

export enum ActionHistoryType {
  Search = 'SEARCH',
  Click = 'CLICK',
  PageView = 'VIEW',
  Custom = 'CUSTOM'
}
export interface IActionHistory {
  name: ActionHistoryType;
  time: number;
  value: {
    [key: string]: string;
  };
}

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

export class UserProfilingEndpoint {
  /**
   * Default platform uri.
   */
  public static DEFAULT_URI = 'https://platform.cloud.coveo.com';

  private caller: EndpointCaller;
  private pendingGetActions: {
    [userId: string]: Promise<IActionHistory[]>;
  };

  /**
   * Create a `UserProfilingEndpoint` instance.
   * Create [`EndpointCaller`]{@link EndpointCaller} instance and uses it to communicate with the endpoint internally.
   * @param options The options to initialize the component.
   */
  constructor(public options: IUserProfilingEndpointOptions) {
    Assert.exists(this.options.accessToken);
    Assert.exists(this.options.organization);

    this.pendingGetActions = {};

    this.options.uri = this.options.uri ? this.options.uri : UserProfilingEndpoint.DEFAULT_URI;

    this.options.accessToken.subscribeToRenewal(this.buildEndpointCaller.bind(this));
    this.buildEndpointCaller(this.options.accessToken.token);
  }

  private buildEndpointCaller(token: string) {
    this.caller = new EndpointCaller({ accessToken: token });
  }

  /**
   * Get the list of actions a user has performed.
   * @param userId Id from which action history will be retrieve. (either visitId or user email).
   */
  public getActions(userId: string): Promise<IActionHistory[]> {
    Assert.exists(userId);

    let request = this.pendingGetActions[userId];

    if (!request) {
      request = this.buildGetActionRequest(userId);
      this.pendingGetActions[userId] = request;
    }

    return request;
  }

  private async buildGetActionRequest(userId: string) {
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
        name: v.name as ActionHistoryType
      };
    });
  }

  private isResponseEmpty(response: ISuccessResponse<IActionsHistoryResponse>) {
    return !response || !response.data || !response.data.value || !Array.isArray(response.data.value) || !(response.data.value.length > 0);
  }
}
