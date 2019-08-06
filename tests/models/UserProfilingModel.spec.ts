import { createSandbox, SinonFakeXMLHttpRequest } from 'sinon';
import { Fake } from 'coveo-search-ui-tests';
import { UserProfileModel, UserAction } from '../../src/models/UserProfileModel';
import { UserActionType } from '../../src/rest/UserProfilingEndpoint';
import { buildActionHistoryResponse, buildAccessToken } from '../utils';
import { Logger, SearchEndpoint } from 'coveo-search-ui';

describe('UserProfilingModel', () => {
    const TEST_URI_HASH = 'testUriHash';
    const TEST_ORGANIZATION = 'testOrg';
    const TEST_REST_URI = 'testRestUri';
    const TEST_TOKEN = buildAccessToken('testToken');
    const TEST_USER = 'testUser';
    const FAKE_HISTORY_ACTIONS = [
        {
            name: UserActionType.Custom,
            time: 1550509202148,
            value: {
                origin_level_1: 'originLevel1',
                c_contentidkey: '@sysurihash',
                c_contentidvalue: 'headphones-gaming',
                event_type: 'addPurchase',
                event_value: 'headphones-gaming'
            }
        },
        {
            name: UserActionType.Search,
            time: 1550509200357,
            value: { cause: 'searchboxSubmit', query_expression: 'Best product', origin_level_1: 'originLevel1' }
        },
        {
            name: UserActionType.Click,
            time: 1547571607604,
            value: {
                uri_hash: 'product1',
                c_contentidkey: '@sysurihash',
                c_contentidvalue: 'product1',
                origin_level_1: 'originLevel1'
            }
        },
        {
            name: UserActionType.PageView,
            time: 1547571617714,
            value: { content_id_key: '@sysurihash', origin_level_1: 'originLevel1', content_id_value: 'product1' }
        }
    ];

    const FAKE_SEARCH_ACTION = {
        name: UserActionType.Search,
        time: 1550509200357,
        value: { cause: 'searchboxSubmit', query_expression: 'Best product', origin_level_1: 'originLevel1' }
    };
    const FAKE_USER_ACTIONS = FAKE_HISTORY_ACTIONS.map(action => new UserAction(action.name, new Date(action.time), action.value));
    const FAKE_ACTIONS_WITH_URI_HASH = [
        {
            name: UserActionType.Click,
            time: 1547571607604,
            value: {
                uri_hash: TEST_URI_HASH,
                c_contentidkey: '@sysurihash',
                c_contentidvalue: 'product1',
                origin_level_1: 'originLevel1'
            }
        },
        {
            name: UserActionType.Click,
            time: 1547571607604,
            value: {
                uri_hash: 'nodoc',
                c_contentidkey: '@sysurihash',
                c_contentidvalue: 'product1',
                origin_level_1: 'originLevel1'
            }
        }
    ];

    let sandbox: sinon.SinonSandbox;
    let xhr: sinon.SinonFakeXMLHttpRequestStatic;
    let requests: sinon.SinonFakeXMLHttpRequest[];

    beforeAll(() => {
        Logger.disable();
        sandbox = createSandbox();
    });

    beforeEach(() => {
        xhr = sandbox.useFakeXMLHttpRequest();

        requests = [];
        xhr.onCreate = (req: SinonFakeXMLHttpRequest) => {
            requests.push(req);
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    afterAll(() => {
        Logger.enable();
    });

    it('should initialize use the Search Endpoint accessToken when no access token is given', async () => {
        let wasAccessed = false;

        const endpoint = sandbox.createStubInstance(SearchEndpoint);
        Object.defineProperty(endpoint, 'accessToken', {
            get: () => {
                wasAccessed = true;
                return buildAccessToken('toto');
            }
        });

        new UserProfileModel(document.createElement('div'), {
            organizationId: TEST_ORGANIZATION,
            restUri: TEST_REST_URI,
            searchEndpoint: endpoint
        });

        expect(wasAccessed).toBe(true);
    });

    describe('getActions', () => {
        it('should attach available documents on click actions', async () => {
            const documentResults = Fake.createFakeResults(1);
            documentResults.results[0].raw.urihash = TEST_URI_HASH;

            const endpoint = sandbox.createStubInstance(SearchEndpoint);
            endpoint.search.returns(Promise.resolve(documentResults));

            const model = new UserProfileModel(document.createElement('div'), {
                organizationId: TEST_ORGANIZATION,
                restUri: TEST_REST_URI,
                accessToken: TEST_TOKEN,
                searchEndpoint: endpoint
            });

            const actionsPromise = model.getActions(TEST_USER);
            requests[requests.length - 1].respond(
                200,
                { 'Content-Type': 'application/json' },
                JSON.stringify(buildActionHistoryResponse(FAKE_ACTIONS_WITH_URI_HASH))
            );

            const actions = await actionsPromise;
            const actionsWithDocument = actions.filter(action => action.document);
            expect(actionsWithDocument.length).toEqual(documentResults.results.length);
            actionsWithDocument.forEach((action, i) => {
                expect(action.document.title).toEqual(documentResults.results[i].title);
                expect(action.document.raw.uri_hash).toEqual(documentResults.results[i].raw.uri_hash);
            });
        });

        it('should attach no documents on click actions when no document are available to the searching user', async () => {
            const endpoint = sandbox.createStubInstance(SearchEndpoint);
            endpoint.search.returns(Promise.resolve(Fake.createFakeResults(0)));

            const model = new UserProfileModel(document.createElement('div'), {
                organizationId: TEST_ORGANIZATION,
                restUri: TEST_REST_URI,
                accessToken: TEST_TOKEN,
                searchEndpoint: endpoint
            });

            const actionsPromise = model.getActions(TEST_USER);

            requests[requests.length - 1].respond(
                200,
                { 'Content-Type': 'application/json' },
                JSON.stringify(buildActionHistoryResponse(FAKE_ACTIONS_WITH_URI_HASH))
            );

            const actions = await actionsPromise;
            expect(actions.filter(action => action.document).length).toEqual(0);
        });

        it('should attach no documents on click actions when the search call for documents details fails', async () => {
            const endpoint = sandbox.createStubInstance(SearchEndpoint);
            endpoint.search.returns(Promise.reject());

            const model = new UserProfileModel(document.createElement('div'), {
                organizationId: TEST_ORGANIZATION,
                restUri: TEST_REST_URI,
                accessToken: TEST_TOKEN,
                searchEndpoint: endpoint
            });

            const actionsPromise = model.getActions(TEST_USER);

            requests[requests.length - 1].respond(
                200,
                { 'Content-Type': 'application/json' },
                JSON.stringify(buildActionHistoryResponse([FAKE_SEARCH_ACTION]))
            );

            const actions = await actionsPromise;
            expect(actions.filter(action => action.document).length).toEqual(0);
        });

        it('should not fetch documents when there is no event with an urihash', async () => {
            const endpoint = sandbox.createStubInstance(SearchEndpoint);
            endpoint.search.returns(Promise.resolve(Fake.createFakeResults(5)));

            const model = new UserProfileModel(document.createElement('div'), {
                organizationId: TEST_ORGANIZATION,
                restUri: TEST_REST_URI,
                accessToken: TEST_TOKEN,
                searchEndpoint: endpoint
            });

            const actionsPromise = model.getActions(TEST_USER);

            requests[requests.length - 1].respond(
                200,
                { 'Content-Type': 'application/json' },
                JSON.stringify(buildActionHistoryResponse([FAKE_SEARCH_ACTION]))
            );

            const actions = await actionsPromise;
            expect(actions.filter(action => action.document).length).toEqual(0);
        });

        it('should fetch all actions from a user', async () => {
            const endpoint = sandbox.createStubInstance(SearchEndpoint);
            endpoint.search.returns(Promise.resolve(Fake.createFakeResults(10)));

            const model = new UserProfileModel(document.createElement('div'), {
                organizationId: TEST_ORGANIZATION,
                restUri: TEST_REST_URI,
                accessToken: TEST_TOKEN,
                searchEndpoint: endpoint
            });

            model.registerNewAttribute(TEST_USER, FAKE_USER_ACTIONS);

            expect(requests.length).toBe(0);

            const actionsPromise = model.getActions(TEST_USER);

            expect(requests.length).toBe(0);

            const data = await actionsPromise;
            expect(data.length).toEqual(FAKE_HISTORY_ACTIONS.length);
            data.forEach((action, i) => {
                expect(action.type).toEqual(FAKE_HISTORY_ACTIONS[i].name);
                expect(action.timestamp.valueOf()).toEqual(FAKE_HISTORY_ACTIONS[i].time);
                expect(JSON.stringify(action.raw)).toEqual(JSON.stringify(FAKE_HISTORY_ACTIONS[i].value));
            });
        });

        describe('when no actions are present in the model', () => {
            it('should fetch all actions of a user from the backend', async () => {
                const endpoint = sandbox.createStubInstance(SearchEndpoint);
                endpoint.search.returns(Promise.resolve(Fake.createFakeResults(10)));

                const model = new UserProfileModel(document.createElement('div'), {
                    organizationId: TEST_ORGANIZATION,
                    restUri: TEST_REST_URI,
                    accessToken: TEST_TOKEN,
                    searchEndpoint: endpoint
                });

                const actionsPromise = model.getActions(TEST_USER);

                expect(requests.length).toBeGreaterThan(0);

                const lastRequest = requests[requests.length - 1];

                expect(lastRequest.method).toBe('POST');
                expect(lastRequest.url).toMatch('user/actions');

                lastRequest.respond(
                    200,
                    { 'Content-Type': 'application/json' },
                    JSON.stringify(buildActionHistoryResponse(FAKE_HISTORY_ACTIONS), null, 0)
                );

                const data = await actionsPromise;
                expect(data.length).toEqual(FAKE_HISTORY_ACTIONS.length);
                data.forEach((action, i) => {
                    expect(action.type).toEqual(FAKE_HISTORY_ACTIONS[i].name);
                    expect(action.timestamp.valueOf()).toEqual(FAKE_HISTORY_ACTIONS[i].time);
                    expect(JSON.stringify(action.raw)).toEqual(JSON.stringify(FAKE_HISTORY_ACTIONS[i].value));
                });
            });

            it('should fetch all actions of a user from the backend even when the search call for document details fails', async () => {
                const endpoint = sandbox.createStubInstance(SearchEndpoint);
                endpoint.search.returns(Promise.reject());

                const model = new UserProfileModel(document.createElement('div'), {
                    organizationId: TEST_ORGANIZATION,
                    restUri: TEST_REST_URI,
                    accessToken: TEST_TOKEN,
                    searchEndpoint: endpoint
                });

                const actionsPromise = model.getActions(TEST_USER);

                expect(requests.length).toBeGreaterThan(0);

                const lastRequest = requests[requests.length - 1];

                expect(lastRequest.method).toBe('POST');
                expect(lastRequest.url).toMatch('user/actions');

                lastRequest.respond(
                    200,
                    { 'Content-Type': 'application/json' },
                    JSON.stringify(buildActionHistoryResponse(FAKE_HISTORY_ACTIONS), null, 0)
                );

                const data = await actionsPromise;
                expect(data.length).toEqual(FAKE_HISTORY_ACTIONS.length);
                data.forEach((action, i) => {
                    expect(action.type).toEqual(FAKE_HISTORY_ACTIONS[i].name);
                    expect(action.timestamp.valueOf()).toEqual(FAKE_HISTORY_ACTIONS[i].time);
                    expect(JSON.stringify(action.raw)).toEqual(JSON.stringify(FAKE_HISTORY_ACTIONS[i].value));
                });
            });
        });
    });
});
