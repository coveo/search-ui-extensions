import * as sinon from 'sinon';
import { Fake } from 'coveo-search-ui-tests';
import { UserProfileModel, UserAction } from '../../src/models/UserProfileModel';
import { ActionHistoryType } from '../../src/rest/UserProfilingEndpoint';
import { buildActionHistoryResponse, buildSearchInterfaceWithResults } from '../utils';
import { Logger } from 'coveo-search-ui';

describe('UserProfilingModel', () => {
  const TEST_URI_HASH = 'testUriHash';
  const TEST_ORGANIZATION = 'testOrg';
  const TEST_USER = 'testUser';
  const FAKE_HISTORY_ACTIONS = [
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
  const FAKE_SEARCH_ACTION = {
    name: ActionHistoryType.Search,
    time: 1550509200357,
    value: { cause: 'searchboxSubmit', query_expression: 'Best product', origin_level_1: 'originLevel1' }
  };
  const FAKE_USER_ACTIONS = FAKE_HISTORY_ACTIONS.map(action => new UserAction(action.name, new Date(action.time), action.value));

  let sandbox: sinon.SinonSandbox;
  let xhr: sinon.SinonFakeXMLHttpRequestStatic;
  let requests: sinon.SinonFakeXMLHttpRequest[];

  beforeAll(() => {
    Logger.disable();
    sandbox = sinon.createSandbox();
  });

  afterAll(() => {
    Logger.enable();
  });

  beforeEach(() => {
    xhr = sandbox.useFakeXMLHttpRequest();

    requests = [];
    xhr.onCreate = req => {
      requests.push(req);
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should create a user profiling endpoint using the provided search interface', () => {
    const searchInterface = buildSearchInterfaceWithResults();
    const model = new UserProfileModel(document.createElement('div'), {
      searchInterface: searchInterface,
      organization: TEST_ORGANIZATION
    });

    expect(model.options.searchInterface).toBe(searchInterface);
  });

  describe('getActions', () => {
    it('should fetch all actions from a user', () => {
      const model = new UserProfileModel(document.createElement('div'), {
        searchInterface: buildSearchInterfaceWithResults(),
        organization: TEST_ORGANIZATION
      });

      model.registerNewAttribute(TEST_USER, FAKE_USER_ACTIONS);

      expect(requests.length).toBe(0);

      const actionsPromise = model.getActions(TEST_USER);

      expect(requests.length).toBe(0);

      return actionsPromise.then(
        data => {
          expect(data.length).toEqual(FAKE_HISTORY_ACTIONS.length);
          data.forEach((action, i) => {
            expect(action.type).toEqual(FAKE_HISTORY_ACTIONS[i].name);
            expect(action.timestamp.valueOf()).toEqual(FAKE_HISTORY_ACTIONS[i].time);
            expect(JSON.stringify(action.raw)).toEqual(JSON.stringify(FAKE_HISTORY_ACTIONS[i].value));
          });
        },
        error => {
          expect(error).toBe(false);
        }
      );
    });

    describe('when no actions are present in the model', () => {
      it('should fetch all actions of a user from the backend', () => {
        const model = new UserProfileModel(document.createElement('div'), {
          searchInterface: buildSearchInterfaceWithResults(),
          organization: TEST_ORGANIZATION
        });
  
        const actionsPromise = model.getActions(TEST_USER);
  
        expect(requests.length).toBeGreaterThan(0);
  
        const lastRequest = requests[requests.length - 1];
  
        expect(lastRequest.method).toBe('POST');
        expect(lastRequest.url).toMatch('user/actions');
  
        lastRequest.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(buildActionHistoryResponse(FAKE_HISTORY_ACTIONS), null, 0));
  
        return actionsPromise.then(
          data => {
            expect(data.length).toEqual(FAKE_HISTORY_ACTIONS.length);
            data.forEach((action, i) => {
              expect(action.type).toEqual(FAKE_HISTORY_ACTIONS[i].name);
              expect(action.timestamp.valueOf()).toEqual(FAKE_HISTORY_ACTIONS[i].time);
              expect(JSON.stringify(action.raw)).toEqual(JSON.stringify(FAKE_HISTORY_ACTIONS[i].value));
            });
          },
          error => {
            expect(error).toBe(false);
          }
        );
      }); 
      it('should fetch all actions of a user from the backend even when the search call for document details fails', () => {
        const model = new UserProfileModel(document.createElement('div'), {
          searchInterface: buildSearchInterfaceWithResults(Promise.reject()),
          organization: TEST_ORGANIZATION
        });
  
        const actionsPromise = model.getActions(TEST_USER);
  
        expect(requests.length).toBeGreaterThan(0);
  
        const lastRequest = requests[requests.length - 1];
  
        expect(lastRequest.method).toBe('POST');
        expect(lastRequest.url).toMatch('user/actions');
  
        lastRequest.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(buildActionHistoryResponse(FAKE_HISTORY_ACTIONS), null, 0));
  
        return actionsPromise.then(
          data => {
            expect(data.length).toEqual(FAKE_HISTORY_ACTIONS.length);
            data.forEach((action, i) => {
              expect(action.type).toEqual(FAKE_HISTORY_ACTIONS[i].name);
              expect(action.timestamp.valueOf()).toEqual(FAKE_HISTORY_ACTIONS[i].time);
              expect(JSON.stringify(action.raw)).toEqual(JSON.stringify(FAKE_HISTORY_ACTIONS[i].value));
            });
          },
          error => {
            expect(error).toBe(false);
          }
        );
      });
    })
  });

  describe('getDocuments', () => {
    const FAKE_ACTIONS_WITH_URI_HASH = [
      {
        name: ActionHistoryType.Click,
        time: 1547571607604,
        value: {
          uri_hash: TEST_URI_HASH,
          c_contentidkey: '@sysurihash',
          c_contentidvalue: 'product1',
          origin_level_1: 'originLevel1'
        }
      },
      {
        name: ActionHistoryType.Click,
        time: 1547571607604,
        value: {
          uri_hash: 'nodoc',
          c_contentidkey: '@sysurihash',
          c_contentidvalue: 'product1',
          origin_level_1: 'originLevel1'
        }
      }
    ];

    it('should give each available document that a user has clicked', () => {
      const singleDocumentResult = Fake.createFakeResults(1);
      singleDocumentResult.results[0].raw.urihash = TEST_URI_HASH;

      const model = new UserProfileModel(document.createElement('div'), {
        searchInterface: buildSearchInterfaceWithResults(Promise.resolve(singleDocumentResult)),
        organization: TEST_ORGANIZATION
      });

      const documentsPromise = model.getDocuments(TEST_USER);
      requests[requests.length - 1].respond(
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(buildActionHistoryResponse(FAKE_ACTIONS_WITH_URI_HASH))
      );

      return documentsPromise.then(
        docs => {
          expect(docs.length).toEqual(singleDocumentResult.results.length);
          docs.forEach((doc, i) => {
            expect(doc.title).toEqual(singleDocumentResult.results[i].title);
            expect(doc.raw.uri_hash).toEqual(singleDocumentResult.results[i].raw.uri_hash);
          });
        },
        error => {
          throw error;
        }
      );
    });
    it('should give no document when no document are available to the searching user', () => {
      const model = new UserProfileModel(document.createElement('div'), {
        searchInterface: buildSearchInterfaceWithResults(Promise.resolve(Fake.createFakeResults(0))),
        organization: TEST_ORGANIZATION
      });

      const documentsPromise = model.getDocuments(TEST_USER);

      requests[requests.length - 1].respond(
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(buildActionHistoryResponse(FAKE_ACTIONS_WITH_URI_HASH))
      );

      return documentsPromise.then(
        docs => {
          expect(docs.length).toEqual(0);
        },
        error => {
          throw error;
        }
      );
    });
    it('should give no document when there is no even with an urihash', () => {
      const model = new UserProfileModel(document.createElement('div'), {
        searchInterface: buildSearchInterfaceWithResults(Promise.resolve(Fake.createFakeResults(5))),
        organization: TEST_ORGANIZATION
      });

      const documentsPromise = model.getDocuments(TEST_USER);

      requests[requests.length - 1].respond(
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(buildActionHistoryResponse([FAKE_SEARCH_ACTION]))
      );

      return documentsPromise.then(
        docs => {
          expect(docs.length).toEqual(0);
        },
        error => {
          expect(error).toBe(false);
        }
      );
    });
    it('should give no document when the search call for documents details fails', () => {
      
      const model = new UserProfileModel(document.createElement('div'), {
        searchInterface: buildSearchInterfaceWithResults(Promise.reject()),
        organization: TEST_ORGANIZATION
      });

      const documentsPromise = model.getDocuments(TEST_USER);

      requests[requests.length - 1].respond(
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(buildActionHistoryResponse([FAKE_SEARCH_ACTION]))
      );

      return documentsPromise.then(
        docs => {
          expect(docs.length).toEqual(0);
        },
        () => {
          expect(false).toBe(true);
        }
      );
    });
  });

  describe('getQueries', () => {
    it('should give all queries that a user has made', () => {
      const model = new UserProfileModel(document.createElement('div'), {
        searchInterface: buildSearchInterfaceWithResults(),
        organization: TEST_ORGANIZATION
      });

      const queriesPromise = model.getQueries(TEST_USER);

      expect(requests.length).toBeGreaterThan(0);

      requests[requests.length - 1].respond(
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(buildActionHistoryResponse(FAKE_HISTORY_ACTIONS))
      );

      return queriesPromise.then(
        queries => {
          const FAKE_QUERIES = FAKE_HISTORY_ACTIONS.filter(action => action.name === ActionHistoryType.Search).map(
            action => action.value.query_expression
          );

          expect(queries.length).toEqual(FAKE_QUERIES.length);
          queries.forEach(query => {
            expect(FAKE_QUERIES).toContain(query);
          });
        },
        () => {
          expect(false).toBe(true);
        }
      );
    });
  });
});
