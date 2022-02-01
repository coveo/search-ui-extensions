import { createSandbox, SinonSandbox, SinonStub } from 'sinon';
import { Mock } from 'coveo-search-ui-tests';
import { QueryList } from '../../../src/components/UserActions/QueryList';
import { UserAction } from '../../../src/models/UserProfileModel';
import { generate, fakeUserProfileModel, waitForPromiseCompletion } from '../../utils';
import { Logger, Omnibox } from 'coveo-search-ui';
import { UserActionType } from '../../../src/rest/UserProfilingEndpoint';

describe('QueryList', () => {
    const sortUserActions = (a: UserAction, b: UserAction) => a.timestamp.getTime() - b.timestamp.getTime();

    const TEST_QUERIES = generate(20, (i) => {
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

    it('should show "No queries made by this user" when no query were made', async () => {
        const mock = Mock.advancedComponentSetup<QueryList>(
            QueryList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, (env) => {
                fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.resolve([]));
                return env;
            })
        );

        await waitForPromiseCompletion();
        const emptyElement = mock.cmp.element.querySelector<HTMLLIElement>('.coveo-empty');

        expect(emptyElement).not.toBeNull();
        expect(emptyElement.innerText).toBe('No queries made by this user');
    });

    it('should show "Most Recent Queries" as title', async () => {
        const mock = Mock.advancedComponentSetup<QueryList>(
            QueryList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, (env) => {
                fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.resolve(TEST_QUERIES));
                return env;
            })
        );

        await waitForPromiseCompletion();

        expect(mock.cmp.element.querySelector('.coveo-title').innerHTML).toMatch('Most Recent Queries');
    });

    it('should show 3 queries by default', async () => {
        const mock = Mock.advancedComponentSetup<QueryList>(
            QueryList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, (env) => {
                fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.resolve(TEST_QUERIES));
                return env;
            })
        );

        await waitForPromiseCompletion();

        const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');

        expect(list.childElementCount).toBe(3);
    });

    it('should show a number of queries equal to the "numberOfItems" option', async () => {
        const mock = Mock.advancedComponentSetup<QueryList>(
            QueryList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId', numberOfItems: 10 }, (env) => {
                fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.resolve(TEST_QUERIES));
                return env;
            })
        );

        await waitForPromiseCompletion();

        const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');

        expect(list.childElementCount).toBe(10);
    });

    it('should display a search icon on every list item', async () => {
        const mock = Mock.advancedComponentSetup<QueryList>(
            QueryList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId', numberOfItems: 10 }, (env) => {
                fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.resolve(TEST_QUERIES));
                return env;
            })
        );

        await waitForPromiseCompletion();

        const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');

        for (let i = 0; i < 3; i++) {
            const icon = list.children.item(i).querySelector<HTMLElement>('svg');
            expect(icon).toBeDefined;
        }
    });

    it('should display a tooltip on hover with the origin_level_1', async () => {
        const expectedOriginLevel1 = 'tooltip-content';
        const SEARCH_EVENTS = [
            new UserAction(
                UserActionType.Search,
                new Date(0),
                { query_expression: 'someQuery', origin_level_1: expectedOriginLevel1 },
                null,
                'someQuery'
            ),
        ];

        const mock = Mock.advancedComponentSetup<QueryList>(
            QueryList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, (env) => {
                fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.resolve(SEARCH_EVENTS));
                return env;
            })
        );
        await waitForPromiseCompletion();

        const listElement = mock.env.element.querySelector<HTMLElement>('.coveo-list-row');
        const hoverEvent = new MouseEvent('mouseenter', {
            view: window,
            bubbles: true,
            cancelable: true,
        });
        listElement.dispatchEvent(hoverEvent);

        const tooltipElement = mock.env.element.querySelector<HTMLElement>('.coveo-tooltip-origin1');
        expect(tooltipElement).not.toBeNull();
        expect(tooltipElement.innerText).toBe(expectedOriginLevel1);
    });

    it('should not display a tooltip if the origin_level_1 is missing', async () => {
        const SEARCH_EVENTS = [new UserAction(UserActionType.Search, new Date(0), { query_expression: 'someQuery' }, null, 'someQuery')];

        const mock = Mock.advancedComponentSetup<QueryList>(
            QueryList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, (env) => {
                fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.resolve(SEARCH_EVENTS));
                return env;
            })
        );
        await waitForPromiseCompletion();

        const listElement = mock.env.element.querySelector<HTMLElement>('.coveo-list-row');
        const hoverEvent = new MouseEvent('mouseenter', {
            view: window,
            bubbles: true,
            cancelable: true,
        });
        listElement.dispatchEvent(hoverEvent);

        const tooltipElement = mock.env.element.querySelector<HTMLElement>('.coveo-tooltip-origin1');
        expect(tooltipElement).toBeNull();
    });

    it('should show all queries when expanded', async () => {
        const mock = Mock.advancedComponentSetup<QueryList>(
            QueryList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId', numberOfItems: 10 }, (env) => {
                fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.resolve(TEST_QUERIES));
                return env;
            })
        );

        await waitForPromiseCompletion();

        mock.env.element.querySelector<HTMLButtonElement>('.coveo-more-less').click();
        await waitForPromiseCompletion();

        expect(mock.env.element.querySelector<HTMLOListElement>('.coveo-list').childElementCount).toBe(TEST_QUERIES.length);
    });

    it('should not show the same query twice', async () => {
        // Setup.
        const SEARCH_EVENTS = [
            new UserAction(UserActionType.Search, new Date(0), { query_expression: 'someQuery', origin_level_1: 'foo' }, null, 'someQuery'),
            new UserAction(UserActionType.Search, new Date(1), { query_expression: 'someQuery2', origin_level_1: 'foo' }, null, 'someQuery2'),
            new UserAction(UserActionType.Search, new Date(2), { query_expression: 'someQuery2', origin_level_1: 'foo' }, null, 'someQuery2'),
            new UserAction(UserActionType.Search, new Date(3), { query_expression: 'someQuery2', origin_level_1: 'foo' }, null, 'someQuery2'),
            new UserAction(UserActionType.Search, new Date(4), { query_expression: 'someQuery', origin_level_1: 'foo' }, null, 'someQuery'),
        ];

        const SORTED_AND_TRIMMED_SEARCH_EVENT = ['someQuery', 'someQuery2'];

        const mock = Mock.advancedComponentSetup<QueryList>(
            QueryList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, (env) => {
                fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.resolve(SEARCH_EVENTS));
                return env;
            })
        );
        await waitForPromiseCompletion();

        // Validation.
        // Expand the whole list of query.
        const button = mock.cmp.element.querySelector<HTMLElement>('.coveo-more-less');
        if (button) {
            button.click();
            await waitForPromiseCompletion();
        }

        const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');
        expect(list.childElementCount).toBe(SORTED_AND_TRIMMED_SEARCH_EVENT.length);

        // Check that the order is respected.
        SORTED_AND_TRIMMED_SEARCH_EVENT.forEach((query, i) => {
            const span = list.children.item(i).querySelector<HTMLElement>('.coveo-link');
            expect(span.innerText).toBe(query);
        });
    });

    it('should render a list of queries made by a user as a list and put the most recent queries on top', async () => {
        const mock = Mock.advancedComponentSetup<QueryList>(
            QueryList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId', numberOfItems: 10 }, (env) => {
                fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.resolve(TEST_QUERIES));
                return env;
            })
        );
        await waitForPromiseCompletion();

        const queries = TEST_QUERIES.sort(sortUserActions).reverse();

        const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');

        list.childNodes.forEach((node: HTMLElement, i) => {
            expect(node.innerHTML).toMatch(queries[i].query);
        });
    });

    it('should fetch the list of query made by a user from the model', async () => {
        let model;

        Mock.advancedComponentSetup<QueryList>(
            QueryList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId', numberOfItems: 10 }, (env) => {
                model = fakeUserProfileModel(env.root, sandbox);
                model.getActions.callsFake(() => Promise.reject());
                return env;
            })
        );
        await waitForPromiseCompletion();

        // @ts-ignore
        expect(model.getActions.called).toBe(true);
    });

    it("should log an error message when the component can't fetch the a list of query made by a user from the model", async () => {
        const errorLoggerStub = sandbox.stub(Logger.prototype, 'error');

        const mock = Mock.advancedComponentSetup<QueryList>(
            QueryList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, (env) => {
                fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.reject());
                return env;
            })
        );
        await waitForPromiseCompletion();

        expect(mock.cmp.element.childElementCount).toBe(0);
        expect(errorLoggerStub.called).toBe(true);
    });

    describe('when a user click on a query', () => {
        it('should do a query in the omnibox if the search interface has an omnibox', async () => {
            const mock = Mock.advancedComponentSetup<QueryList>(
                QueryList,
                new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId', numberOfItems: 10 }, (env) => {
                    fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.resolve(TEST_QUERIES));
                    return env;
                })
            );

            const omnibox = new Omnibox(document.createElement('div'), {}, { ...mock.env });
            mock.env.root.appendChild(omnibox.element);

            const setTextStub = sandbox.stub(omnibox, 'setText');

            const executeQueryStub = sandbox.stub(mock.env.queryController, 'executeQuery');

            await waitForPromiseCompletion();
            const item = mock.env.element.querySelector<HTMLSpanElement>('.coveo-list .coveo-link');
            item.click();
            await waitForPromiseCompletion();

            expect(setTextStub.calledWith(item.innerText)).toBe(true);

            expect(executeQueryStub.called).toBe(true);
        });

        it('should not do a query if the search interface does not have an omnibox', async () => {
            const mock = Mock.advancedComponentSetup<QueryList>(
                QueryList,
                new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId', numberOfItems: 10 }, (env) => {
                    fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.resolve(TEST_QUERIES));
                    return env;
                })
            );
            await waitForPromiseCompletion();

            const executeQueryStub = sandbox.stub(mock.env.queryController, 'executeQuery');

            const item = mock.env.element.querySelector<HTMLElement>('.coveo-list .coveo-link');
            item.click();
            await waitForPromiseCompletion();

            expect(executeQueryStub.called).toBe(false);
        });

        it('Should disable itself when the userId is falsey', async () => {
            let getActionStub: SinonStub<[HTMLElement, QueryList], void>;
            const mock = Mock.advancedComponentSetup<QueryList>(
                QueryList,
                new Mock.AdvancedComponentSetupOptions(null, { userId: null }, (env) => {
                    getActionStub = fakeUserProfileModel(env.root, sandbox).getActions;
                    return env;
                })
            );
            await waitForPromiseCompletion();

            expect(getActionStub.called).toBe(false);
            expect(mock.cmp.disabled).toBe(true);
        });

        it('Should disable itself when the userId is empty string', async () => {
            let getActionStub: SinonStub<[HTMLElement, QueryList], void>;
            const mock = Mock.advancedComponentSetup<QueryList>(
                QueryList,
                new Mock.AdvancedComponentSetupOptions(null, { userId: '' }, (env) => {
                    getActionStub = fakeUserProfileModel(env.root, sandbox).getActions;
                    return env;
                })
            );
            await waitForPromiseCompletion();

            expect(getActionStub.called).toBe(false);
            expect(mock.cmp.disabled).toBe(true);
        });
    });
});
