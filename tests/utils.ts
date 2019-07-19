import { IActionHistory } from '../src/rest/UserProfilingEndpoint';
import { SearchEndpoint, IQueryResults } from 'coveo-search-ui';
import { Fake, Mock } from 'coveo-search-ui-tests';

/**
 * Create an access token from a SearchEndpoint.
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

export function generate<T>(time: number, generator: (i: number) => T): T[] {
  let list = [];
  for (let i = 0; i < time; i++) {
    list[i] = generator(i);
  }
  return list;
}

export function delay(callback: () => any, timemout = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(callback());
    }, timemout);
  });
}
