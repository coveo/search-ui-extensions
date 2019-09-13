import { createSandbox, SinonSandbox } from 'sinon';
import { Mock } from 'coveo-search-ui-tests';
import { QueryList } from '../../../src/components/UserActions/QueryList';
import { UserAction } from '../../../src/models/UserProfileModel';
import { delay, generate, fakeUserProfileModel } from '../../utils';
import { Logger, Omnibox } from 'coveo-search-ui';
import { UserActionType } from '../../../src/rest/UserProfilingEndpoint';

describe('QueryList', () => {
    const sortUserActions = (a: UserAction, b: UserAction) => a.timestamp.getTime() - b.timestamp.getTime();

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
        const mock = Mock.advancedComponentSetup<QueryList>(
            QueryList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve([]));
                return env;
            })
        );

        return delay(() => {
            const emptyElement = mock.cmp.element.querySelector<HTMLLIElement>('.coveo-empty');

            expect(emptyElement).not.toBeNull();
            expect(emptyElement.innerText).toBe('No queries made by this user');
        });
    });

    it('should show "Recent Queries" as title', () => {
        const mock = Mock.advancedComponentSetup<QueryList>(
            QueryList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(TEST_QUERIES));
                return env;
            })
        );

        return delay(() => {
            expect(mock.cmp.element.querySelector('.coveo-title').innerHTML).toMatch('Recent Queries');
        });
    });

    it('should show 4 queries by default', () => {
        const mock = Mock.advancedComponentSetup<QueryList>(
            QueryList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(TEST_QUERIES));
                return env;
            })
        );

        return delay(() => {
            const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');

            expect(list.childElementCount).toBe(4);
        });
    });

    it('should show a number of queries equal to the "numberOfItems" option', () => {
        const mock = Mock.advancedComponentSetup<QueryList>(
            QueryList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId', numberOfItems: 10 }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(TEST_QUERIES));
                return env;
            })
        );

        return delay(() => {
            const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');

            expect(list.childElementCount).toBe(10);
        });
    });

    it('should display a search icon on every list item', () => {
        const mock = Mock.advancedComponentSetup<QueryList>(
            QueryList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId', numberOfItems: 10 }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(TEST_QUERIES));
                return env;
            })
        );

        return delay(() => {
            const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');

            for(let i=0; i<4; i++){
                const icon = list.children.item(i).querySelector<HTMLElement>('svg');
                expect(icon).toBeDefined;
            };
        })
    })

    it('should show all queries when expanded', () => {
        const mock = Mock.advancedComponentSetup<QueryList>(
            QueryList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId', numberOfItems: 10 }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(TEST_QUERIES));
                return env;
            })
        );

        return delay(() => {
            mock.env.element.querySelector<HTMLButtonElement>('.coveo-more-less').click();

            return delay(() => {
                expect(mock.env.element.querySelector<HTMLOListElement>('.coveo-list').childElementCount).toBe(TEST_QUERIES.length);
            });
        });
    });

    it('should not show the same query twice', () => {
        // Setup.
        const SEARCH_EVENTS = [
            new UserAction(UserActionType.Search, new Date(0), { query_expression: 'someQuery', origin_level_1: 'foo' }, null, 'someQuery'),
            new UserAction(UserActionType.Search, new Date(1), { query_expression: 'someQuery2', origin_level_1: 'foo' }, null, 'someQuery2'),
            new UserAction(UserActionType.Search, new Date(2), { query_expression: 'someQuery2', origin_level_1: 'foo' }, null, 'someQuery2'),
            new UserAction(UserActionType.Search, new Date(3), { query_expression: 'someQuery2', origin_level_1: 'foo' }, null, 'someQuery2'),
            new UserAction(UserActionType.Search, new Date(4), { query_expression: 'someQuery', origin_level_1: 'foo' }, null, 'someQuery')
        ];

        const SORTED_AND_TRIMMED_SEARCH_EVENT = ['someQuery', 'someQuery2'];

        const mock = Mock.advancedComponentSetup<QueryList>(
            QueryList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(SEARCH_EVENTS));
                return env;
            })
        );

        // Validation.
        return delay(() => {
            // Expand the whole list of query.
            const button = mock.cmp.element.querySelector<HTMLElement>('.coveo-more-less');
            if (button) {
                button.click();
            }

            const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');
            expect(list.childElementCount).toBe(SORTED_AND_TRIMMED_SEARCH_EVENT.length);

            // Check that the order is respected.
            SORTED_AND_TRIMMED_SEARCH_EVENT.forEach((query, i) => {
                const span = list.children.item(i).querySelector<HTMLElement>('.coveo-content');
                expect(span.innerText).toBe(query);
            });
        });
    });

    it('should render a list of queries made by a user as a list and put the most recent queries on top', () => {
        const mock = Mock.advancedComponentSetup<QueryList>(
            QueryList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId', numberOfItems: 10 }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(TEST_QUERIES));
                return env;
            })
        );

        const queries = TEST_QUERIES.sort(sortUserActions).reverse();

        return delay(() => {
            const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');

            list.childNodes.forEach((node: HTMLElement, i) => {
                expect(node.innerHTML).toMatch(queries[i].query);
            });
        });
    });

    it('should fetch the list of query made by a user from the model', () => {
        let model;

        Mock.advancedComponentSetup<QueryList>(
            QueryList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId', numberOfItems: 10 }, env => {
                model = fakeUserProfileModel(env.root, sandbox);
                model.getActions.returns(Promise.reject());
                return env;
            })
        );

        // @ts-ignore
        expect(model.getActions.called).toBe(true);
    });

    it("should log an error message when the component can't fetch the a list of query made by a user from the model", () => {
        const errorLoggerStub = sandbox.stub(Logger.prototype, 'error');

        const mock = Mock.advancedComponentSetup<QueryList>(
            QueryList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.reject());
                return env;
            })
        );

        return delay(() => {
            expect(mock.cmp.element.childElementCount).toBe(0);
            expect(errorLoggerStub.called).toBe(true);
        });
    });

    describe('when a user click on a query', () => {
        it('should do a query in the omnibox if the search interface has an omnibox', () => {
            const mock = Mock.advancedComponentSetup<QueryList>(
                QueryList,
                new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId', numberOfItems: 10 }, env => {
                    fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(TEST_QUERIES));
                    return env;
                })
            );

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
            const mock = Mock.advancedComponentSetup<QueryList>(
                QueryList,
                new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId', numberOfItems: 10 }, env => {
                    fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(TEST_QUERIES));
                    return env;
                })
            );

            const executeQueryStub = sandbox.stub(mock.env.queryController, 'executeQuery');

            return delay(() => {
                const item = mock.env.element.querySelector<HTMLElement>('.coveo-list .coveo-content');
                item.click();

                expect(executeQueryStub.called).toBe(false);
            });
        });

        it('should log a search event with "userActionsSubmit" as search cause', () => {
            const mock = Mock.advancedComponentSetup<QueryList>(
                QueryList,
                new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId', numberOfItems: 10 }, env => {
                    fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(TEST_QUERIES));
                    return env;
                })
            );

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
