import { SinonSandbox, createSandbox } from 'sinon';
import { UserProfileModel, UserAction } from '../../../src/models/UserProfileModel';
import { Mock, Fake } from 'coveo-search-ui-tests';
import { InitializationUtils } from '../../../src/utils/initialization';
import { ActionHistoryType } from '../../../src/rest/UserProfilingEndpoint';
import { UserActivity } from '../../../src/Index';
import { delay } from '../../utils';
import { formatDate, formatTime, formatTimeInterval } from '../../../src/utils/time';

describe('UserActivity', () => {
  const FAKE_CLICK_EVENT = new UserAction(ActionHistoryType.Click, new Date('1:00:00 AM'), {
    origin_level_1: 'relevant' + Math.random(),
    uri_hash: 'product' + Math.random(),
    c_contentidkey: '@sysurihash',
    c_contentidvalue: '' + Math.random()
  });
  FAKE_CLICK_EVENT.document = Fake.createFakeResult();
  const FAKE_SEARCH_EVENT = new UserAction(ActionHistoryType.Search, new Date('1:00:00 AM'), {
    origin_level_1: 'relevant' + Math.random(),
    cause: 'interfaceLoad'
  });
  const FAKE_USER_SEARCH_EVENT = new UserAction(ActionHistoryType.Search, new Date('1:00:00 AM'), {
    origin_level_1: 'relevant' + Math.random(),
    query_expression: 'someSearch' + Math.random(),
    cause: 'searchboxSubmit'
  });
  FAKE_USER_SEARCH_EVENT.query = FAKE_USER_SEARCH_EVENT.raw.query_expression;
  const FAKE_VIEW_EVENT = new UserAction(ActionHistoryType.PageView, new Date('1:00:00 AM'), {
    origin_level_1: 'relevant' + Math.random(),
    content_id_key: '@someKey' + Math.random(),
    content_id_value: 'someValue' + Math.random()
  });
  const FAKE_CUSTOM_EVENT = new UserAction(ActionHistoryType.Custom, new Date('1:00:00 AM'), {
    origin_level_1: 'relevant' + Math.random(),
    event_type: 'Submit' + Math.random(),
    event_value: 'Case Submit' + Math.random()
  });
  const FAKE_CUSTOM_EVENT_WITHOUT_TYPE = new UserAction(ActionHistoryType.Custom, new Date('1:00:00 AM'), {
    origin_level_1: 'relevant' + Math.random(),
    event_value: 'Case Submit' + Math.random()
  });
  const IRRELEVANT_ACTIONS = [
    new UserAction(ActionHistoryType.Search, new Date('2:00:00 AM'), {
      origin_level_1: 'not relevant' + Math.random(),
      query_expression: 'not relevant',
      cause: 'interfaceLoad'
    }),
    new UserAction(ActionHistoryType.PageView, new Date('2:10:00 AM'), {
      origin_level_1: 'not relevant' + Math.random(),
      content_id_key: '@sysurihash',
      content_id_value: 'product1'
    }),
    new UserAction(ActionHistoryType.Custom, new Date('2:20:00 AM'), {
      origin_level_1: 'not relevant' + Math.random(),
      c_contentidkey: '@sysurihash',
      c_contentidvalue: 'headphones-gaming',
      event_type: 'addPurchase',
      event_value: 'headphones-gaming'
    }),
    new UserAction(ActionHistoryType.Custom, new Date('2:30:00 AM'), {
      origin_level_1: 'relevant' + Math.random(),
      c_contentidkey: '@sysurihash',
      c_contentidvalue: 'headphones-gaming',
      event_type: 'addPurchase',
      event_value: 'headphones-gaming'
    })
  ];

  const FAKE_USER_ACTIONS = [
    new UserAction(ActionHistoryType.Search, new Date('1:00:00 AM'), {
      origin_level_1: 'relevant' + Math.random(),
      cause: 'searchboxSubmit',
      query_expression: 'Best product'
    }),
    new UserAction(ActionHistoryType.Click, new Date('3:00:00 AM'), {
      origin_level_1: 'relevant' + Math.random(),
      uri_hash: 'product' + Math.random(),
      c_contentidkey: '@sysurihash',
      c_contentidvalue: 'product1'
    })
  ];

  let sandbox: SinonSandbox;

  beforeAll(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should show the stating date and time of the user action session', () => {
    const model = sandbox.createStubInstance(UserProfileModel);
    model.getActions.returns(Promise.resolve(FAKE_USER_ACTIONS));
    sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

    const mock = Mock.basicComponentSetup<UserActivity>(UserActivity, { userId: 'testuserId' });

    const timestamps = FAKE_USER_ACTIONS.map(action => action.timestamp).sort();

    return delay(() => {
      const firstAction = timestamps[0];
      expect(mock.cmp.element.innerHTML).toMatch(formatDate(firstAction));
      expect(mock.cmp.element.innerHTML).toMatch(formatTime(firstAction));
    });
  });
  it('should duration of the user action session', () => {
    const model = sandbox.createStubInstance(UserProfileModel);
    model.getActions.returns(Promise.resolve(FAKE_USER_ACTIONS));
    sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

    const mock = Mock.basicComponentSetup<UserActivity>(UserActivity, { userId: 'testuserId' });

    const timestamps = FAKE_USER_ACTIONS.map(action => action.timestamp).sort();

    return delay(() => {
      expect(mock.cmp.element.innerHTML).toMatch(formatTimeInterval(timestamps[timestamps.length - 1].getTime() - timestamps[0].getTime()));
    });
  });
  it('should fold each actions that are tagged as not meaningful', () => {
    const model = sandbox.createStubInstance(UserProfileModel);
    model.getActions.returns(Promise.resolve([...FAKE_USER_ACTIONS, ...IRRELEVANT_ACTIONS]));
    sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

    const mock = Mock.basicComponentSetup<UserActivity>(UserActivity, { userId: 'testuserId' });

    return delay(() => {
      IRRELEVANT_ACTIONS.forEach(action => {
        expect(mock.cmp.element.querySelector('.coveo-activity').innerHTML).not.toMatch(action.raw.origin_level_1);
      });
    });
  });
  it('should show each actions that are tagged as meaningful', () => {
    const model = sandbox.createStubInstance(UserProfileModel);
    model.getActions.returns(Promise.resolve([...FAKE_USER_ACTIONS, ...IRRELEVANT_ACTIONS]));
    sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

    const mock = Mock.basicComponentSetup<UserActivity>(UserActivity, { userId: 'testuserId' });

    return delay(() => {
      FAKE_USER_ACTIONS.forEach(action => {
        expect(mock.cmp.element.querySelector('.coveo-activity').innerHTML).toMatch(action.raw.origin_level_1);
      });
    });
  });
  it('should show all actions when no action are tagged as meaningful', () => {
    const model = sandbox.createStubInstance(UserProfileModel);
    model.getActions.returns(Promise.resolve(IRRELEVANT_ACTIONS));
    sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

    const mock = Mock.basicComponentSetup<UserActivity>(UserActivity, { userId: 'testuserId' });

    return delay(() => {
      IRRELEVANT_ACTIONS.forEach(action => {
        expect(mock.cmp.element.querySelector('.coveo-activity').innerHTML).toMatch(action.raw.origin_level_1);
      });
    });
  });

  describe('folded events', () => {
    it('should unfold on click', () => {
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getActions.returns(Promise.resolve([...FAKE_USER_ACTIONS, ...IRRELEVANT_ACTIONS]));
      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

      const mock = Mock.basicComponentSetup<UserActivity>(UserActivity, { userId: 'testuserId' });

      return delay(() => {
        const folded = mock.cmp.element.querySelector<HTMLElement>('.coveo-folded');
        expect(folded).not.toBeNull();
        folded.click();
        IRRELEVANT_ACTIONS.forEach(action => {
          expect(mock.cmp.element.querySelector('.coveo-activity').innerHTML).toMatch(action.raw.origin_level_1);
        });
      });
    });
  });

  describe('search event', () => {
    it('should display the "User Query" as event title when there is a query expression', () => {
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getActions.returns(Promise.resolve([FAKE_USER_SEARCH_EVENT]));
      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

      const mock = Mock.basicComponentSetup<UserActivity>(UserActivity, { userId: 'testuserId' });

      return delay(() => {
        const clickElement = mock.cmp.element.querySelector('.coveo-search');
        expect(clickElement).not.toBeNull();
        expect(clickElement.querySelector<HTMLElement>('.coveo-title').innerText).toBe('User Query');
      });
    });
    it('should display the "Query" as event title', () => {
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getActions.returns(Promise.resolve([FAKE_SEARCH_EVENT]));
      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

      const mock = Mock.basicComponentSetup<UserActivity>(UserActivity, { userId: 'testuserId' });

      return delay(() => {
        const clickElement = mock.cmp.element.querySelector('.coveo-search');
        expect(clickElement).not.toBeNull();
        expect(clickElement.querySelector<HTMLElement>('.coveo-title').innerText).toBe('Query');
      });
    });
    it('should display the query made by the user as event data', () => {
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getActions.returns(Promise.resolve([FAKE_USER_SEARCH_EVENT]));
      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

      const mock = Mock.basicComponentSetup<UserActivity>(UserActivity, { userId: 'testuserId' });

      return delay(() => {
        const clickElement = mock.cmp.element.querySelector('.coveo-search');
        expect(clickElement).not.toBeNull();
        expect(clickElement.querySelector<HTMLElement>('.coveo-data').innerText).toBe(FAKE_USER_SEARCH_EVENT.query);
      });
    });
    it('should display the time of the event as event footer', () => {
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getActions.returns(Promise.resolve([FAKE_SEARCH_EVENT]));
      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

      const mock = Mock.basicComponentSetup<UserActivity>(UserActivity, { userId: 'testuserId' });

      return delay(() => {
        const searchElement = mock.cmp.element.querySelector('.coveo-search');
        expect(searchElement).not.toBeNull();
        expect(searchElement.querySelector<HTMLElement>('.coveo-footer').innerText).toMatch(formatTime(FAKE_SEARCH_EVENT.timestamp));
      });
    });
    it('should display the originLevel1 as event footer', () => {
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getActions.returns(Promise.resolve([FAKE_SEARCH_EVENT]));
      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

      const mock = Mock.basicComponentSetup<UserActivity>(UserActivity, { userId: 'testuserId' });

      return delay(() => {
        const clickElement = mock.cmp.element.querySelector('.coveo-search');
        expect(clickElement).not.toBeNull();
        expect(clickElement.querySelector<HTMLElement>('.coveo-footer').innerText).toMatch(FAKE_SEARCH_EVENT.raw.origin_level_1);
      });
    });
  });

  describe('click event', () => {
    it('should display the "Clicked Document" as event title', () => {
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getActions.returns(Promise.resolve([FAKE_CLICK_EVENT]));
      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

      const mock = Mock.basicComponentSetup<UserActivity>(UserActivity, { userId: 'testuserId' });

      return delay(() => {
        const clickElement = mock.cmp.element.querySelector('.coveo-click');
        expect(clickElement).not.toBeNull();
        expect(clickElement.querySelector<HTMLElement>('.coveo-title').innerText).toBe('Clicked Document');
      });
    });
    it('should display a link to the clicked document as event data', () => {
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getActions.returns(Promise.resolve([FAKE_CLICK_EVENT]));
      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

      const mock = Mock.basicComponentSetup<UserActivity>(UserActivity, { userId: 'testuserId' });

      return delay(() => {
        const clickElement = mock.cmp.element.querySelector('.coveo-click');
        expect(clickElement).not.toBeNull();
        expect(clickElement.querySelector<HTMLAnchorElement>('.coveo-data').nodeName).toBe('A');
        expect(clickElement.querySelector<HTMLAnchorElement>('.coveo-data').innerText).toBe(FAKE_CLICK_EVENT.document.title);
        expect(clickElement.querySelector<HTMLAnchorElement>('.coveo-data').href).toMatch(FAKE_CLICK_EVENT.document.clickUri);
      });
    });
    it('should display the time of the event as event footer', () => {
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getActions.returns(Promise.resolve([FAKE_CLICK_EVENT]));
      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

      const mock = Mock.basicComponentSetup<UserActivity>(UserActivity, { userId: 'testuserId' });

      return delay(() => {
        const clickElement = mock.cmp.element.querySelector('.coveo-click');
        expect(clickElement).not.toBeNull();
        expect(clickElement.querySelector<HTMLElement>('.coveo-footer').innerText).toMatch(formatTime(FAKE_CLICK_EVENT.timestamp));
      });
    });
    it('should display the originLevel1 as event footer', () => {
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getActions.returns(Promise.resolve([FAKE_CLICK_EVENT]));
      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

      const mock = Mock.basicComponentSetup<UserActivity>(UserActivity, { userId: 'testuserId' });

      return delay(() => {
        const clickElement = mock.cmp.element.querySelector('.coveo-click');
        expect(clickElement).not.toBeNull();
        expect(clickElement.querySelector<HTMLElement>('.coveo-footer').innerText).toMatch(FAKE_CLICK_EVENT.raw.origin_level_1);
      });
    });
  });

  describe('page view event', () => {
    it('should display the "Page View" as event title', () => {
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getActions.returns(Promise.resolve([FAKE_VIEW_EVENT]));
      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

      const mock = Mock.basicComponentSetup<UserActivity>(UserActivity, { userId: 'testuserId' });

      return delay(() => {
        const viewElement = mock.cmp.element.querySelector('.coveo-view');
        expect(viewElement).not.toBeNull();
        expect(viewElement.querySelector<HTMLElement>('.coveo-title').innerText).toBe('Page View');
      });
    });
    it('should display the content id key and value as event data', () => {
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getActions.returns(Promise.resolve([FAKE_VIEW_EVENT]));
      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

      const mock = Mock.basicComponentSetup<UserActivity>(UserActivity, { userId: 'testuserId' });

      return delay(() => {
        const viewElement = mock.cmp.element.querySelector('.coveo-view');
        expect(viewElement).not.toBeNull();
        expect(viewElement.querySelector<HTMLElement>('.coveo-data').innerText).toMatch(FAKE_VIEW_EVENT.raw.content_id_key);
        expect(viewElement.querySelector<HTMLElement>('.coveo-data').innerText).toMatch(FAKE_VIEW_EVENT.raw.content_id_value);
      });
    });
    it('should display the time of the event as event footer', () => {
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getActions.returns(Promise.resolve([FAKE_VIEW_EVENT]));
      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

      const mock = Mock.basicComponentSetup<UserActivity>(UserActivity, { userId: 'testuserId' });

      return delay(() => {
        const viewElement = mock.cmp.element.querySelector('.coveo-view');
        expect(viewElement).not.toBeNull();
        expect(viewElement.querySelector<HTMLElement>('.coveo-footer').innerText).toMatch(formatTime(FAKE_VIEW_EVENT.timestamp));
      });
    });
    it('should display the originLevel1 as event footer', () => {
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getActions.returns(Promise.resolve([FAKE_VIEW_EVENT]));
      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

      const mock = Mock.basicComponentSetup<UserActivity>(UserActivity, { userId: 'testuserId' });

      return delay(() => {
        const viewElement = mock.cmp.element.querySelector('.coveo-view');
        expect(viewElement).not.toBeNull();
        expect(viewElement.querySelector<HTMLElement>('.coveo-footer').innerText).toMatch(FAKE_VIEW_EVENT.raw.origin_level_1);
      });
    });
  });

  describe('custom event', () => {
    it('should display the event type as event title', () => {
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getActions.returns(Promise.resolve([FAKE_CUSTOM_EVENT]));
      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

      const mock = Mock.basicComponentSetup<UserActivity>(UserActivity, { userId: 'testuserId' });

      return delay(() => {
        const clickElement = mock.cmp.element.querySelector('.coveo-custom');
        expect(clickElement).not.toBeNull();
        expect(clickElement.querySelector<HTMLElement>('.coveo-title').innerText).toBe(FAKE_CUSTOM_EVENT.raw.event_type);
      });
    });
    it('should display the Custom as event title when the event type is unavailable', () => {
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getActions.returns(Promise.resolve([FAKE_CUSTOM_EVENT_WITHOUT_TYPE]));
      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

      const mock = Mock.basicComponentSetup<UserActivity>(UserActivity, { userId: 'testuserId' });

      return delay(() => {
        const clickElement = mock.cmp.element.querySelector('.coveo-custom');
        expect(clickElement).not.toBeNull();
        expect(clickElement.querySelector<HTMLElement>('.coveo-title').innerText).toBe('Custom');
      });
    });
    it('should display the event value as event data', () => {
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getActions.returns(Promise.resolve([FAKE_CUSTOM_EVENT]));
      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

      const mock = Mock.basicComponentSetup<UserActivity>(UserActivity, { userId: 'testuserId' });

      return delay(() => {
        const clickElement = mock.cmp.element.querySelector('.coveo-custom');
        expect(clickElement).not.toBeNull();
        expect(clickElement.querySelector<HTMLElement>('.coveo-data').innerText).toBe(FAKE_CUSTOM_EVENT.raw.event_value);
      });
    });
    it('should display the time of the event as event footer', () => {
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getActions.returns(Promise.resolve([FAKE_CUSTOM_EVENT]));
      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

      const mock = Mock.basicComponentSetup<UserActivity>(UserActivity, { userId: 'testuserId' });

      return delay(() => {
        const clickElement = mock.cmp.element.querySelector('.coveo-custom');
        expect(clickElement).not.toBeNull();
        expect(clickElement.querySelector<HTMLElement>('.coveo-footer').innerText).toMatch(formatTime(FAKE_CUSTOM_EVENT.timestamp));
      });
    });
    it('should display the originLevel1 as event footer', () => {
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getActions.returns(Promise.resolve([FAKE_CUSTOM_EVENT]));
      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

      const mock = Mock.basicComponentSetup<UserActivity>(UserActivity, { userId: 'testuserId' });

      return delay(() => {
        const clickElement = mock.cmp.element.querySelector('.coveo-custom');
        expect(clickElement).not.toBeNull();
        expect(clickElement.querySelector<HTMLElement>('.coveo-footer').innerText).toMatch(FAKE_CUSTOM_EVENT.raw.origin_level_1);
      });
    });
  });
});
