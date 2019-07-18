import { Mock, Fake } from 'coveo-search-ui-tests';
import { UserActions } from '../../../src/components/UserActions/UserActions';
import { Logger, Initialization, QueryEvents } from 'coveo-search-ui';
import { createSandbox, SinonSandbox } from 'sinon';
import { UserProfileModel } from '../../../src/models/UserProfileModel';
import { generate, delay } from '../../utils';
import { InitializationUtils } from '../../../src/utils/initialization';
import { DocumentsClicked, Queries, UserActivity } from '../../../src/Index';

describe('UserActions', () => {
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

  it('should show a panel that has as title "Session Summary"', () => {
    const model = sandbox.createStubInstance(UserProfileModel);
    model.getDocuments.returns(Promise.resolve(Fake.createFakeResults(20).results));
    model.getQueries.returns(Promise.resolve(generate(20, () => `${Math.random()}`)));

    sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

    sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

    const mock = Mock.basicComponentSetup<UserActions>(UserActions);

    expect(mock.cmp.element.querySelector<HTMLElement>('.coveo-summary .coveo-accordion-header-title').innerText).toBe('Session Summary');
  });
  it('should show a summary section that have a DocumentsClicked and a Queries component', () => {
    const model = sandbox.createStubInstance(UserProfileModel);
    model.getDocuments.returns(Promise.resolve(Fake.createFakeResults(20).results));
    model.getQueries.returns(Promise.resolve(generate(20, () => `${Math.random()}`)));

    sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

    const automaticallyCreateComponentsInsideStub = sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

    const mock = Mock.basicComponentSetup<UserActions>(UserActions);
    const summerySection = mock.cmp.element.querySelector('.coveo-summary');

    expect(automaticallyCreateComponentsInsideStub.called).toBe(true);
    expect(summerySection.querySelector('.CoveoDocumentsClicked')).not.toBeNull();
    expect(summerySection.querySelector('.CoveoQueries')).not.toBeNull();
  });
  it('should show a user activity section that have a UserActivity component', () => {
    const model = sandbox.createStubInstance(UserProfileModel);
    model.getDocuments.returns(Promise.resolve(Fake.createFakeResults(20).results));
    model.getQueries.returns(Promise.resolve(generate(20, () => `${Math.random()}`)));

    sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

    const automaticallyCreateComponentsInsideStub = sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

    const mock = Mock.basicComponentSetup<UserActions>(UserActions);
    const detailSection = mock.cmp.element.querySelector('.coveo-details');

    expect(automaticallyCreateComponentsInsideStub.called).toBe(true);
    expect(detailSection.querySelector<HTMLElement>('.coveo-accordion-header-title').innerText).toBe('User Activity');
    expect(detailSection.querySelector('.CoveoUserActivity')).not.toBeNull();
  });
  it('should pass the user id option to each of it sub components', () => {
    const FAKE_USER_ID = 'someUserId' + Math.random();

    const model = sandbox.createStubInstance(UserProfileModel);
    model.getDocuments.returns(Promise.resolve(Fake.createFakeResults(20).results));
    model.getQueries.returns(Promise.resolve(generate(20, () => `${Math.random()}`)));

    sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

    const automaticallyCreateComponentsInsideStub = sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

    Mock.basicComponentSetup<UserActions>(UserActions, {
      userId: FAKE_USER_ID
    });

    expect(automaticallyCreateComponentsInsideStub.called).toBe(true);

    [DocumentsClicked.ID, Queries.ID, UserActivity.ID].forEach(component => {
      expect(automaticallyCreateComponentsInsideStub.args[0][1].options[component]).toBeDefined();
      expect(automaticallyCreateComponentsInsideStub.args[0][1].options[component].userId).toBe(FAKE_USER_ID);
    });
  });
  it('should hide itself whenever a query is made', () => {
    const model = sandbox.createStubInstance(UserProfileModel);
    model.getDocuments.returns(Promise.resolve(Fake.createFakeResults(20).results));
    model.getQueries.returns(Promise.resolve(generate(20, () => `${Math.random()}`)));

    sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

    sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

    const mock = Mock.basicComponentSetup<UserActions>(UserActions);

    const hideSpy = sandbox.spy(mock.cmp, 'hide');

    mock.env.root.dispatchEvent(new CustomEvent(QueryEvents.newQuery));

    expect(hideSpy.called).toBe(true);
  });
  it('should show a message when no actions are available');

  describe('when the accordion header is clicked', () => {
    it('should fold the accordion section when the accordion section is open', () => {
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getDocuments.returns(Promise.resolve(Fake.createFakeResults(20).results));
      model.getQueries.returns(Promise.resolve(generate(20, () => `${Math.random()}`)));

      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

      const automaticallyCreateComponentsInsideStub = sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

      const mock = Mock.basicComponentSetup<UserActions>(UserActions);
      const accordionSections = mock.cmp.element.querySelectorAll('.coveo-accordion');

      expect(automaticallyCreateComponentsInsideStub.called).toBe(true);

      accordionSections.forEach(el => {
        el.querySelector<HTMLElement>('.coveo-accordion-header').click();
      });

      return delay(() => {
        accordionSections.forEach(el => {
          expect(el.classList).toContain('coveo-folded');
        });
      });
    });
    it('should unfold the accordion section when the accordion section is closed', () => {
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getDocuments.returns(Promise.resolve(Fake.createFakeResults(20).results));
      model.getQueries.returns(Promise.resolve(generate(20, () => `${Math.random()}`)));

      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

      const automaticallyCreateComponentsInsideStub = sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

      const mock = Mock.basicComponentSetup<UserActions>(UserActions);
      const accordionSections = mock.cmp.element.querySelectorAll('.coveo-accordion');

      expect(automaticallyCreateComponentsInsideStub.called).toBe(true);

      accordionSections.forEach(el => {
        el.classList.add('coveo-folded');
        el.querySelector<HTMLElement>('.coveo-accordion-header').click();
      });

      return delay(() => {
        accordionSections.forEach(el => {
          expect(el.classList).not.toContain('coveo-folded');
        });
      });
    });
  });

  describe('toggle', () => {
    it('should show the component if the component is hidden', () => {
      // Setup.
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getDocuments.returns(Promise.resolve(Fake.createFakeResults(20).results));
      model.getQueries.returns(Promise.resolve(generate(20, () => `${Math.random()}`)));

      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);
      sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

      const mock = Mock.basicComponentSetup<UserActions>(UserActions);

      mock.cmp.hide();

      const domMutation = sandbox.stub();
      const observer = new MutationObserver(domMutation);
      observer.observe(mock.cmp.element, { childList: true, subtree: true });

      // Scenario.
      mock.cmp.toggle();

      // Tests.
      return delay(() => {
        expect(domMutation.called).toBe(true);
        expect(mock.cmp.element.querySelector('.coveo-summary')).not.toBeNull();
        expect(mock.cmp.element.querySelector('.coveo-details')).not.toBeNull();
      }).finally(() => {
        observer.disconnect();
      });
    });
    it('should hide the component if the component is shown', () => {
      // Setup.
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getDocuments.returns(Promise.resolve(Fake.createFakeResults(20).results));
      model.getQueries.returns(Promise.resolve(generate(20, () => `${Math.random()}`)));

      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);
      sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

      const mock = Mock.basicComponentSetup<UserActions>(UserActions);

      mock.cmp.show();

      const domMutation = sandbox.stub();
      const observer = new MutationObserver(domMutation);
      observer.observe(mock.cmp.element, { childList: true, subtree: true });

      // Scenario.
      mock.cmp.toggle();

      // Tests.
      return delay(() => {
        expect(domMutation.called).toBe(true);
        expect(mock.cmp.element.querySelector('.coveo-summary')).toBeNull();
        expect(mock.cmp.element.querySelector('.coveo-details')).toBeNull();
      }).finally(() => {
        observer.disconnect();
      });
    });
  });

  describe('show', () => {
    it('should show the component if the component is hidden', () => {
      // Setup.
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getDocuments.returns(Promise.resolve(Fake.createFakeResults(20).results));
      model.getQueries.returns(Promise.resolve(generate(20, () => `${Math.random()}`)));

      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);
      sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

      const mock = Mock.basicComponentSetup<UserActions>(UserActions);

      mock.cmp.hide();

      const domMutation = sandbox.stub();
      const observer = new MutationObserver(domMutation);
      observer.observe(mock.cmp.element, { childList: true, subtree: true });

      // Scenario.
      mock.cmp.show();

      // Tests.
      return delay(() => {
        expect(domMutation.called).toBe(true);
        expect(mock.cmp.element.querySelector('.coveo-summary')).not.toBeNull();
        expect(mock.cmp.element.querySelector('.coveo-details')).not.toBeNull();
      }).finally(() => {
        observer.disconnect();
      });
    });
    it('should do nothing if the component is shown', () => {
      // Setup.
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getDocuments.returns(Promise.resolve(Fake.createFakeResults(20).results));
      model.getQueries.returns(Promise.resolve(generate(20, () => `${Math.random()}`)));

      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);
      sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

      const mock = Mock.basicComponentSetup<UserActions>(UserActions);

      mock.cmp.show();

      const domMutation = sandbox.stub();
      const observer = new MutationObserver(domMutation);
      observer.observe(mock.cmp.element, { childList: true, subtree: true });

      // Scenario.
      mock.cmp.show();

      // Tests.
      return delay(() => {
        expect(domMutation.called).toBe(false);
        expect(mock.cmp.element.querySelector('.coveo-summary')).not.toBeNull();
        expect(mock.cmp.element.querySelector('.coveo-details')).not.toBeNull();
      }).finally(() => {
        observer.disconnect();
      });
    });
  });

  describe('hide', () => {
    it('should hide the component if the component is shown', () => {
      // Setup.
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getDocuments.returns(Promise.resolve(Fake.createFakeResults(20).results));
      model.getQueries.returns(Promise.resolve(generate(20, () => `${Math.random()}`)));

      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);
      sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

      const mock = Mock.basicComponentSetup<UserActions>(UserActions);

      mock.cmp.show();

      const domMutation = sandbox.stub();
      const observer = new MutationObserver(domMutation);
      observer.observe(mock.cmp.element, { childList: true, subtree: true });

      // Scenario.
      mock.cmp.hide();

      // Tests.
      return delay(() => {
        expect(domMutation.called).toBe(true);
        expect(mock.cmp.element.querySelector('.coveo-summary')).toBeNull();
        expect(mock.cmp.element.querySelector('.coveo-details')).toBeNull();
      }).finally(() => {
        observer.disconnect();
      });
    });
    it('should do nothing if the component is hidden', () => {
      // Setup.
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getDocuments.returns(Promise.resolve(Fake.createFakeResults(20).results));
      model.getQueries.returns(Promise.resolve(generate(20, () => `${Math.random()}`)));

      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);
      sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

      const mock = Mock.basicComponentSetup<UserActions>(UserActions);

      mock.cmp.hide();

      const domMutation = sandbox.stub();
      const observer = new MutationObserver(domMutation);
      observer.observe(mock.cmp.element, { childList: true, subtree: true });

      // Scenario.
      mock.cmp.hide();

      // Tests.
      return delay(() => {
        expect(domMutation.called).toBe(false);
        expect(mock.cmp.element.querySelector('.coveo-summary')).toBeNull();
        expect(mock.cmp.element.querySelector('.coveo-details')).toBeNull();
      }).finally(() => {
        observer.disconnect();
      });
    });
  });
});
