import { createSandbox, SinonSandbox } from 'sinon';
import { Mock } from 'coveo-search-ui-tests';
import { RecentQueries } from '../../../src/components/UserActions/RecentQueries';
import { InitializationUtils } from '../../../src/utils/initialization';
import { UserProfileModel, UserAction } from '../../../src/models/UserProfileModel';
import { delay, generate } from '../../utils';
import { Logger, Omnibox } from 'coveo-search-ui';
import { UserActionType } from '../../../src/rest/UserProfilingEndpoint';

describe('RecentQueries', () => {
    const TEST_QUERIES = generate(20, i => {
        const query = `${Math.random()}`;
        return new UserAction(UserActionType.Search, new Date(i), { query_expression: query, origin_level_1: 'foo' }, null, query);
    });
    let sandbox: SinonSandbox;

    beforeAll(() => {
        Logger.disable();
    });

    beforeEach(() => {
        sandbox = createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    afterAll(() => {
        Logger.enable();
    });

    it('should show "No queries made by this user" when no query were made', () => {
        const model = sandbox.createStubInstance(UserProfileModel);
        model.getActions.returns(Promise.resolve([]));

        sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

        const mock = Mock.basicComponentSetup<RecentQueries>(RecentQueries, { userId: 'testuserId' });

        return delay(() => {
            const emptyElement = mock.cmp.element.querySelector<HTMLLIElement>('.coveo-empty');

            expect(emptyElement).not.toBeNull();
            expect(emptyElement.innerText).toBe('No queries made by this user');
        });
    });

    it('should show "Recent Queries" as title', () => {
        const model = sandbox.createStubInstance(UserProfileModel);
        model.getActions.returns(Promise.resolve(TEST_QUERIES));

        sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

        const mock = Mock.basicComponentSetup<RecentQueries>(RecentQueries, { userId: 'testuserId' });

        return delay(() => {
            expect(mock.cmp.element.querySelector('.coveo-title').innerHTML).toMatch('Recent Queries');
        });
    });

    it('should show 4 queries by default', () => {
        const model = sandbox.createStubInstance(UserProfileModel);
        model.getActions.returns(Promise.resolve(TEST_QUERIES));

        sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

        const mock = Mock.basicComponentSetup<RecentQueries>(RecentQueries, { userId: 'testuserId' });

        return delay(() => {
            const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');

            expect(list.childElementCount).toBe(4);
        });
    });

    it('should show a number of queries equal to the "numberOfItems" option', () => {
        const model = sandbox.createStubInstance(UserProfileModel);
        model.getActions.returns(Promise.resolve(TEST_QUERIES));

        sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

        const mock = Mock.basicComponentSetup<RecentQueries>(RecentQueries, { userId: 'testuserId', numberOfItems: 10 });

        return delay(() => {
            const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');

            expect(list.childElementCount).toBe(10);
        });
    });

    it('should show all queries when expanded', () => {
        const model = sandbox.createStubInstance(UserProfileModel);
        model.getActions.returns(Promise.resolve(TEST_QUERIES));

        sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

        const mock = Mock.basicComponentSetup<RecentQueries>(RecentQueries);

        return delay(() => {
            mock.env.element.querySelector<HTMLButtonElement>('.coveo-more-less').click();

            return delay(() => {
                expect(mock.env.element.querySelector<HTMLOListElement>('.coveo-list').childElementCount).toBe(TEST_QUERIES.length);
            });
        });
    });

    it('should render a list of queries made by a user as a list and put the most recent queries on top', () => {
        const model = sandbox.createStubInstance(UserProfileModel);
        model.getActions.returns(Promise.resolve(TEST_QUERIES));
        sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

        const mock = Mock.basicComponentSetup<RecentQueries>(RecentQueries, { userId: 'testuserId' });

        const queries = TEST_QUERIES.reverse();

        return delay(() => {
            const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');

            list.childNodes.forEach((node: HTMLElement, i) => {
                expect(node.innerHTML).toMatch(queries[i].query);
            });
        });
    });

    it('should fetch the list of query made by a user from the model', () => {
        const model = sandbox.createStubInstance(UserProfileModel);
        model.getActions.returns(Promise.reject());
        sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

        Mock.basicComponentSetup<RecentQueries>(RecentQueries, { userId: 'testuserId' });

        expect(model.getActions.called).toBe(true);
    });

    it("should log an error message when the component can't fetch the a list of query made by a user from the model", () => {
        const model = sandbox.createStubInstance(UserProfileModel);
        model.getActions.returns(Promise.reject());
        sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

        const errorLoggerStub = sandbox.stub(Logger.prototype, 'error');

        const mock = Mock.basicComponentSetup<RecentQueries>(RecentQueries, { userId: 'testuserId' });

        return delay(() => {
            expect(mock.cmp.element.childElementCount).toBe(0);
            expect(errorLoggerStub.called).toBe(true);
        });
    });

    describe('when a user click on a query', () => {
        it('should do a query in the omnibox if the search interface has an omnibox', () => {
            const model = sandbox.createStubInstance(UserProfileModel);
            model.getActions.returns(Promise.resolve(TEST_QUERIES));
            sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

            const mock = Mock.basicComponentSetup<RecentQueries>(RecentQueries, { userId: 'testuserId' });

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

        it('should not do a query if the search interface does not have an omnibox', () => {
            const model = sandbox.createStubInstance(UserProfileModel);
            model.getActions.returns(Promise.resolve(TEST_QUERIES));
            sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

            const mock = Mock.basicComponentSetup<RecentQueries>(RecentQueries, { userId: 'testuserId' });

            const executeQueryStub = sandbox.stub(mock.env.queryController, 'executeQuery');

            return delay(() => {
                const item = mock.env.element.querySelector<HTMLElement>('.coveo-list .coveo-content');
                item.click();

                expect(executeQueryStub.called).toBe(false);
            });
        });

        it('should log a search event with "userActionsSubmit" as search cause', () => {
            const model = sandbox.createStubInstance(UserProfileModel);
            model.getActions.returns(Promise.resolve(TEST_QUERIES));
            sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

            const mock = Mock.basicComponentSetup<RecentQueries>(RecentQueries, { userId: 'testuserId' });

            const omnibox = new Omnibox(document.createElement('div'), {}, { ...mock.env });
            mock.env.root.appendChild(omnibox.element);

            const logSearchEventStub = sandbox.stub(mock.env.usageAnalytics, 'logSearchEvent');

            return delay(() => {
                const item = mock.env.element.querySelector<HTMLSpanElement>('.coveo-list .coveo-content');
                item.click();

                expect(logSearchEventStub.callCount).toBe(1);
                expect(logSearchEventStub.args[0][0].name).toBe('userActionsSubmit');
                expect(logSearchEventStub.args[0][0].type).toBe('User Actions');
            });
        });
    });
});
