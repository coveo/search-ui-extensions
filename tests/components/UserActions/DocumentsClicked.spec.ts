import { createSandbox, SinonSandbox } from 'sinon';
import { Mock, Fake } from 'coveo-search-ui-tests';
import { DocumentsClicked } from '../../../src/components/UserActions/DocumentsClicked';
import { InitializationUtils } from '../../../src/utils/initialization';
import { UserProfileModel } from '../../../src/models/UserProfileModel';
import { Logger, Initialization } from 'coveo-search-ui';
import { delay } from '../../utils';

describe('DocumentsClicked', () => {
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

  it('should show a text when there is no document clicked', () => {
    const model = sandbox.createStubInstance(UserProfileModel);
    model.getDocuments.returns(Promise.resolve([]));
    sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

    const mock = Mock.basicComponentSetup<DocumentsClicked>(DocumentsClicked, { userId: 'testuserId' });

    return delay(() => {
      const emptyElement = mock.cmp.element.querySelector<HTMLLIElement>('.coveo-empty');
      expect(emptyElement).not.toBeNull();
      expect(emptyElement.innerText).toBe('No document clicked by this user');
    });
  });
  it('should show "Documents Clicked" as title', () => {
    const model = sandbox.createStubInstance(UserProfileModel);
    model.getDocuments.returns(Promise.resolve(Fake.createFakeResults(20).results));
    sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

    const mock = Mock.basicComponentSetup<DocumentsClicked>(DocumentsClicked, { userId: 'testuserId' });

    return delay(() => {
      expect(mock.cmp.element.querySelector('.coveo-title').innerHTML).toMatch('Documents Clicked');
    });
  });
  it('should show 4 documents', () => {
    const model = sandbox.createStubInstance(UserProfileModel);
    model.getDocuments.returns(Promise.resolve(Fake.createFakeResults(20).results));
    sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

    sandbox.stub(Initialization, 'automaticallyCreateComponentsInsideResult');

    const mock = Mock.basicComponentSetup<DocumentsClicked>(DocumentsClicked, { userId: 'testuserId' });

    return delay(() => {
      const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');

      expect(list.childElementCount).toBe(4);
    });
  });
  it('should show 8 documents when expanded', () => {
    const model = sandbox.createStubInstance(UserProfileModel);
    model.getDocuments.returns(Promise.resolve(Fake.createFakeResults(20).results));
    sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

    sandbox.stub(Initialization, 'automaticallyCreateComponentsInsideResult');

    const mock = Mock.basicComponentSetup<DocumentsClicked>(DocumentsClicked);

    return delay(() => {
      const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');
      const button = mock.env.element.querySelector<HTMLButtonElement>('.coveo-more-less');
      button.click();

      return delay(() => {
        expect(list.childElementCount).toBe(8);
      });
    });
  });
  it('should render the a list of document clicked by a user as a list of ResultLink', () => {
    const results = Fake.createFakeResults(20).results;
    const model = sandbox.createStubInstance(UserProfileModel);
    model.getDocuments.returns(Promise.resolve(results));
    sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

    const createComponentInside = sandbox.stub(Initialization, 'automaticallyCreateComponentsInsideResult');

    const mock = Mock.basicComponentSetup<DocumentsClicked>(DocumentsClicked, { userId: 'testuserId' });

    return delay(() => {
      const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');

      list.childNodes.forEach((node: HTMLElement, i) => {
        expect(node.innerHTML).toMatch('CoveoResultLink');
        expect(createComponentInside.calledWith(node.firstChild as HTMLElement, results[i])).toBe(true);
      });
    });
  });
  it('should fetch the a list of document clicked by a user from the model', () => {
    const model = sandbox.createStubInstance(UserProfileModel);
    model.getDocuments.returns(Promise.reject());
    sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

    Mock.basicComponentSetup<DocumentsClicked>(DocumentsClicked, { userId: 'testuserId' });

    expect(model.getDocuments.called).toBe(true);
  });
  it("should log an error message when the component can't fetch the list of document clicked by a user from the model", () => {
    const model = sandbox.createStubInstance(UserProfileModel);
    model.getDocuments.returns(Promise.reject());
    sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

    const errorLoggerStub = sandbox.stub(Logger.prototype, 'error');

    const mock = Mock.basicComponentSetup<DocumentsClicked>(DocumentsClicked, { userId: 'testuserId' });

    return delay(() => {
      expect(mock.cmp.element.childElementCount).toBe(0);
      expect(errorLoggerStub.called).toBe(true);
    });
  });

  describe('template', () => {
    it('should use the given template in options', () => {
      const results = Fake.createFakeResults(20).results;
      const model = sandbox.createStubInstance(UserProfileModel);
      model.getDocuments.returns(Promise.resolve(results));
      sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

      sandbox.stub(Initialization, 'automaticallyCreateComponentsInsideResult');
      const instantiateToElementStub = sandbox.stub().returns(Promise.resolve(document.createElement('div')));

      Mock.basicComponentSetup<DocumentsClicked>(DocumentsClicked, {
        userId: 'testuserId',
        max: results.length,
        nbShowed: results.length,
        template: {
          instantiateToElement: instantiateToElementStub
        }
      });

      return delay(() => {
        expect(instantiateToElementStub.callCount).toBe(results.length);
        results.forEach((result, i) => {
          expect(instantiateToElementStub.args[i][0]).toBe(result);
        });
      });
    });
  });
});
