import { IActionHistory } from '../src/rest/UserProfilingEndpoint';
import { SearchEndpoint, IQueryResults } from 'coveo-search-ui';
import { Fake, Mock } from 'coveo-search-ui-tests';

/**
 * Create an access token from a SearchEndpoint.
 * @param token A search token.
 */
export function buildAccessToken(token: string) {
    return new SearchEndpoint({
        accessToken: token,
        renewAccessToken: () => Promise.resolve(token),
        restUri: 'https://test.uri.test'
    }).accessToken;
}

/**
 * Create a fake response payload.
 * @param actions Actions to put in response.
 */
export function buildActionHistoryResponse(actions: IActionHistory[]) {
    return {
        value:
            actions &&
            actions.map(action => {
                return {
                    name: action.name,
                    time: action.time.toString(),
                    value: JSON.stringify(action.value, null, 0)
                };
            }),
        debug: false,
        internalExecutionLog: [''],
        executionTime: 0.949252553
    };
}

/**
 * Initialize a SearchInterface with some results.
 * @param results Results that the searchEndpoint will respond with.
 */
export function buildSearchInterfaceWithResults(results: Promise<IQueryResults> = Promise.resolve(Fake.createFakeResults(0))) {
    const searchInterface = Mock.mockSearchInterface();
    searchInterface.queryController = Mock.mockQueryController();

    const searchEndpoint = Mock.mockSearchEndpoint();
    searchEndpoint.accessToken = buildAccessToken('testAccessToken');
    (searchEndpoint.search as any).and.returnValue(results);

    searchInterface.options.endpoint = searchEndpoint;

    searchInterface.queryController.getEndpoint = () => searchEndpoint;

    return searchInterface;
}

/**
 * Feed a generator with value from 0 to time.
 * @param time Number of time to call the generator.
 * @param generator A generator function.
 */
export function generate<T>(time: number, generator: (i: number) => T): T[] {
    let list = [];
    for (let i = 0; i < time; i++) {
        list[i] = generator(i);
    }
    return list;
}

/**
 * Exacute a function after a certain delay.
 * @param callback The callback to call.
 * @param timemout The timeout to wait.
 */
export function delay(callback: () => any, timemout = 0) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(callback());
        }, timemout);
    });
}
