import { IActionHistory } from '../src/rest/UserProfilingEndpoint';
import { SearchEndpoint } from 'coveo-search-ui';
import { SinonSandbox } from 'sinon';
import { UserProfileModel } from '../src/Index';

/**
 * Create an access token from a SearchEndpoint.
 * @param token A search token.
 */
export function buildAccessToken(token: string) {
    return new SearchEndpoint({
        accessToken: token,
        renewAccessToken: () => Promise.resolve(token),
        restUri: 'https://test.uri.test',
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
            actions.map((action) => {
                return {
                    name: action.name,
                    time: action.time.toString(),
                    value: JSON.stringify(action.value, null, 0),
                };
            }),
        debug: false,
        internalExecutionLog: [''],
        executionTime: 0.949252553,
    };
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
export function delay<T = any>(callback: () => T, timemout = 0) {
    return new Promise<T>((resolve) => {
        setTimeout(() => {
            resolve(callback());
        }, timemout);
    });
}

export const waitForPromiseCompletion = () => delay(() => {});

/**
 * Create a fake user profile model instance.
 * @param root The root of the Search interface.
 * @param sandbox A sinon Sandbox.
 */
export function fakeUserProfileModel(root: HTMLElement, sandbox: SinonSandbox) {
    (root as any)[`Coveo${UserProfileModel.ID}`] = sandbox.createStubInstance(UserProfileModel);
    return (root as any)[`Coveo${UserProfileModel.ID}`];
}
