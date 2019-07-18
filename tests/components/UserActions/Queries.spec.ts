import { createSandbox, SinonSandbox } from 'sinon';
import { Mock } from 'coveo-search-ui-tests';
import { Queries } from '../../../src/components/UserActions/Queries';
import { InitializationUtils } from '../../../src/utils/initialization';
import { UserProfileModel } from '../../../src/models/UserProfileModel';
import { delay, generate } from '../../utils';
import { Logger, Omnibox } from 'coveo-search-ui';

describe('Queries', () => {
  const TEST_QUERIES = generate(20, () => `${Math.random()}`);
  let sandbox: SinonSandbox;

  beforeAll(() => {
    Logger.disable();
  });

  afterAll(() => {
    Logger.enable();
  });

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should show "No queries made by this user" when no query were made', () => {
    const model = sandbox.createStubInstance(UserProfileModel);
    model.getQueries.returns(Promise.resolve([]));
    sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

    const mock = Mock.basicComponentSetup<Queries>(Queries, { userId: 'testuserId' });

    return delay(() => {
      const emptyElement = mock.cmp.element.querySelector<HTMLLIElement>('.coveo-empty');
      expect(emptyElement).not.toBeNull();
      expect(emptyElement.innerText).toBe('No queries made by this user');
    });
  });
  it('should show "Queries" as title', () => {
    const model = sandbox.createStubInstance(UserProfileModel);
    model.getQueries.returns(Promise.resolve(TEST_QUERIES));
    sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

    const mock = Mock.basicComponentSetup<Queries>(Queries, { userId: 'testuserId' });

    return delay(() => {
      expect(mock.cmp.element.querySelector('.coveo-title').innerHTML).toMatch('Queries');
    });
  });
  it('should show 4 queries', () => {
    const model = sandbox.createStubInstance(UserProfileModel);
    model.getQueries.returns(Promise.resolve(TEST_QUERIES));
    sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

    const mock = Mock.basicComponentSetup<Queries>(Queries, { userId: 'testuserId' });

    return delay(() => {
      const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');

      expect(list.childElementCount).toBe(4);
    });
  });
  it('should show 8 queries when expanded', () => {
    const model = sandbox.createStubInstance(UserProfileModel);
    model.getQueries.returns(Promise.resolve(TEST_QUERIES));
    sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

    const mock = Mock.basicComponentSetup<Queries>(Queries);

    return delay(() => {
      const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');
      const button = mock.env.element.querySelector<HTMLButtonElement>('.coveo-more-less');
      button.click();

      return delay(() => {
        expect(list.childElementCount).toBe(8);
      });
    });
  });
  it('should render the a list of queries made by a user as a list', () => {
    const model = sandbox.createStubInstance(UserProfileModel);
    model.getQueries.returns(Promise.resolve(TEST_QUERIES));
    sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

    const mock = Mock.basicComponentSetup<Queries>(Queries, { userId: 'testuserId' });

    return delay(() => {
      const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');

      list.childNodes.forEach((node: HTMLElement, i) => {
        expect(node.innerHTML).toMatch(TEST_QUERIES[i]);
      });
    });
  });
  it('should fetch the a list of query made by a user from the model', () => {
    const model = sandbox.createStubInstance(UserProfileModel);
    model.getQueries.returns(Promise.reject());
    sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

    Mock.basicComponentSetup<Queries>(Queries, { userId: 'testuserId' });

    expect(model.getQueries.called).toBe(true);
  });
  it("should log an error message when the component can't fetch the a list of query made by a user from the model", () => {
    const model = sandbox.createStubInstance(UserProfileModel);
    model.getQueries.returns(Promise.reject());
    sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

    const errorLoggerStub = sandbox.stub(Logger.prototype, 'error');

    const mock = Mock.basicComponentSetup<Queries>(Queries, { userId: 'testuserId' });

    return delay(() => {
      expect(mock.cmp.element.childElementCount).toBe(0);
      expect(errorLoggerStub.called).toBe(true);
    });
  });
  describe('when a user click on a querie', () => {
    it('should do a querie in the omnibox if the search interface has a omnibox', () => {
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getQueries.returns(Promise.resolve(TEST_QUERIES));
      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

      const mock = Mock.basicComponentSetup<Queries>(Queries, { userId: 'testuserId' });

      const omnibox = new Omnibox(document.createElement('div'), {}, { ...mock.env });
      mock.env.root.appendChild(omnibox.element);

      const setTextStub = sandbox.stub(omnibox, 'setText');

      const executeQueryStub = sandbox.stub(mock.env.queryController, 'executeQuery');

      return delay(() => {
        const item = mock.env.element.querySelector<HTMLSpanElement>('.coveo-list .coveo-content');
        item.click();

        expect(setTextStub.calledWith(item.innerText)).toBe(true);

        expect(executeQueryStub.called).toBe(true);
      });
    });
    it('should not do a querie if the search interface does not have a omnibox', () => {
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getQueries.returns(Promise.resolve(TEST_QUERIES));
      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

      const mock = Mock.basicComponentSetup<Queries>(Queries, { userId: 'testuserId' });

      const executeQueryStub = sandbox.stub(mock.env.queryController, 'executeQuery');

      return delay(() => {
        const item = mock.env.element.querySelector<HTMLElement>('.coveo-list .coveo-content');
        item.click();

        expect(executeQueryStub.called).toBe(false);
      });
    });
    it('should log a search event with "userActionsSubmit" as search cause', () => {
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getQueries.returns(Promise.resolve(TEST_QUERIES));
      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

      const mock = Mock.basicComponentSetup<Queries>(Queries, { userId: 'testuserId' });

      const omnibox = new Omnibox(document.createElement('div'), {}, { ...mock.env });
      mock.env.root.appendChild(omnibox.element);

      const logSearchEventStub = sandbox.stub(mock.env.usageAnalytics, 'logSearchEvent');

      return delay(() => {
        const item = mock.env.element.querySelector<HTMLSpanElement>('.coveo-list .coveo-content');
        item.click();

        expect(logSearchEventStub.callCount).toBe(1);
        expect(logSearchEventStub.args[0][0].name).toBe('userActionsSubmit');
      });
    });
  });
});
