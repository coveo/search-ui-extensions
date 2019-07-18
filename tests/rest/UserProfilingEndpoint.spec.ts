import * as sinon from 'sinon';
import { UserProfilingEndpoint, ActionHistoryType } from '../../src/rest/UserProfilingEndpoint';
import { buildActionHistoryResponse, buildAccessToken } from '../utils';
import { Logger } from 'coveo-search-ui';

describe('UserProfilingEndpoint', () => {
  const TEST_ACCESS_TOKEN = 'testAccessToken';
  const TEST_ORGANIZATION = 'testOrganization';
  const TEST_URI = 'https://test.uri.test';
  const TEST_USER_ID = 'testUserId';
  const FAKE_ACTIONS = [
    {
      name: ActionHistoryType.Custom,
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
      name: ActionHistoryType.Search,
      time: 1550509200357,
      value: { cause: 'searchboxSubmit', query_expression: 'Best product', origin_level_1: 'originLevel1' }
    },
    {
      name: ActionHistoryType.Click,
      time: 1547571607604,
      value: {
        uri_hash: 'product1',
        c_contentidkey: '@sysurihash',
        c_contentidvalue: 'product1',
        origin_level_1: 'originLevel1'
      }
    },
    {
      name: ActionHistoryType.PageView,
      time: 1547571617714,
      value: { content_id_key: '@sysurihash', origin_level_1: 'originLevel1', content_id_value: 'product1' }
    }
  ];

  let sandbox: sinon.SinonSandbox;
  let xhr: sinon.SinonFakeXMLHttpRequestStatic;
  let request: sinon.SinonFakeXMLHttpRequest[];

  beforeAll(() => {
    Logger.disable();
    sandbox = sinon.createSandbox();
  });

  afterAll(() => {
    Logger.enable();
  });

  beforeEach(() => {
    xhr = sandbox.useFakeXMLHttpRequest();

    request = [];
    xhr.onCreate = req => {
      request.push(req);
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('should override the uri with the default uri when none is given as an option', () => {
      const endpoint = new UserProfilingEndpoint({
        accessToken: buildAccessToken(TEST_ACCESS_TOKEN),
        organization: TEST_ORGANIZATION
      });

      expect(endpoint.options.uri).toEqual(UserProfilingEndpoint.DEFAULT_URI);
    });
  });

  describe('getActions', () => {
    it('should fire a POST request on the ActionsHistory Endpoint', () => {
      new UserProfilingEndpoint({
        accessToken: buildAccessToken(TEST_ACCESS_TOKEN),
        organization: TEST_ORGANIZATION,
        uri: TEST_URI
      }).getActions(TEST_USER_ID);

      const LAST_REQUEST = request[request.length - 1];

      expect(LAST_REQUEST.method).toEqual('POST');
      expect(LAST_REQUEST.requestBody).toContain(TEST_USER_ID);
      expect(LAST_REQUEST.url).toContain(`/rest/organizations/${TEST_ORGANIZATION}/machinelearning/user/actions`);
      expect(JSON.stringify(LAST_REQUEST.requestHeaders)).toContain(TEST_ACCESS_TOKEN);
    });

    it('should fire a POST request on the ActionsHistory Endpoint once per userId', () => {
      const endpoint = new UserProfilingEndpoint({
        accessToken: buildAccessToken(TEST_ACCESS_TOKEN),
        organization: TEST_ORGANIZATION,
        uri: TEST_URI
      });
      endpoint.getActions(TEST_USER_ID);
      endpoint.getActions(TEST_USER_ID);

      expect(JSON.stringify(request.map(r => (r ? [r.method, r.url] : r)), null, 4)).not.toBe('');
      expect(request.filter(r => r.method).length).toBe(1);

      const LAST_REQUEST = request[request.length - 1];

      expect(LAST_REQUEST.method).toEqual('POST');
      expect(LAST_REQUEST.requestBody).toContain(TEST_USER_ID);
      expect(LAST_REQUEST.url).toContain(`/rest/organizations/${TEST_ORGANIZATION}/machinelearning/user/actions`);
      expect(JSON.stringify(LAST_REQUEST.requestHeaders)).toContain(TEST_ACCESS_TOKEN);
    });

    describe('when the rest call succeed', () => {
      it('should return a resolved promise that contains all requested actions', () => {
        const RESPONSE = new UserProfilingEndpoint({
          accessToken: buildAccessToken(TEST_ACCESS_TOKEN),
          organization: TEST_ORGANIZATION,
          uri: TEST_URI
        }).getActions(TEST_USER_ID);

        request[request.length - 1].respond(
          200,
          { 'Content-Type': 'application/json' },
          JSON.stringify(buildActionHistoryResponse(FAKE_ACTIONS), null, 0)
        );

        return RESPONSE.then(actions => {
          expect(actions.length).toBeGreaterThanOrEqual(0);
          expect(actions.length).toEqual(FAKE_ACTIONS.length);
          actions.forEach((action, i) => {
            expect(action.name).toEqual(FAKE_ACTIONS[i].name);
            expect(action.time).toEqual(FAKE_ACTIONS[i].time);
            expect(JSON.stringify(action.value)).toEqual(JSON.stringify(FAKE_ACTIONS[i].value));
          });
        });
      });

      it('should return a rejected promise that contains all requested actions when no actions is available', () => {
        const RESPONSE = new UserProfilingEndpoint({
          accessToken: buildAccessToken(TEST_ACCESS_TOKEN),
          organization: TEST_ORGANIZATION,
          uri: TEST_URI
        }).getActions(TEST_USER_ID);

        request[request.length - 1].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(buildActionHistoryResponse([]), null, 0));

        return RESPONSE.then(
          () => {
            expect(false).toBe(true);
          },
          error => {
            expect(error instanceof Error).toBe(true);
          }
        );
      });

      it('should return a rejected promise when no value are present in the response', () => {
        const RESPONSE = new UserProfilingEndpoint({
          accessToken: buildAccessToken(TEST_ACCESS_TOKEN),
          organization: TEST_ORGANIZATION,
          uri: TEST_URI
        }).getActions(TEST_USER_ID);

        request[request.length - 1].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(buildActionHistoryResponse(null), null, 0));

        return RESPONSE.then(
          () => {
            expect(false).toBe(true);
          },
          error => {
            expect(error instanceof Error).toBe(true);
          }
        );
      });
    });
    describe('when the rest call fail', () => {
      it('should return a rejected promise when the call fail', () => {
        const RESPONSE = new UserProfilingEndpoint({
          accessToken: buildAccessToken(TEST_ACCESS_TOKEN),
          organization: TEST_ORGANIZATION,
          uri: TEST_URI
        }).getActions(TEST_USER_ID);

        request[request.length - 1].respond(400, {}, '');

        return RESPONSE.then(
          () => {
            throw new Error('Expected reject but got resolve');
          },
          () => {}
        );
      });
    });
  });
});
