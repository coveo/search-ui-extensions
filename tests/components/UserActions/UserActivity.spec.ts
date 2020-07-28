import { SinonSandbox, createSandbox, SinonStub } from 'sinon';
import { UserAction } from '../../../src/models/UserProfileModel';
import { Mock, Fake } from 'coveo-search-ui-tests';
import { UserActionType } from '../../../src/rest/UserProfilingEndpoint';
import { UserActivity } from '../../../src/Index';
import { fakeUserProfileModel } from '../../utils';
import { formatDate, formatTime, formatDateAndTime, formatDateAndTimeShort, formatTimeInterval } from '../../../src/utils/time';

describe('UserActivity', () => {
    const TEST_DATE_STRING = 'December 17, 1995 1:00:00 AM';
    const ACTIVITY_SELECTOR = '.coveo-activity';
    const ACTIVITY_TITLE_SELECTOR = '.coveo-activity-title';
    const ACTIVIY_TIMESTAMP_SELECTOR = '.coveo-activity-timestamp';

    const FAKE_CLICK_EVENT = new UserAction(UserActionType.Click, new Date(TEST_DATE_STRING), {
        origin_level_1: 'relevant' + Math.random(),
        uri_hash: 'product' + Math.random(),
        c_contentidkey: '@sysurihash',
        c_contentidvalue: '' + Math.random(),
    });
    FAKE_CLICK_EVENT.document = Fake.createFakeResult();

    const FAKE_SEARCH_EVENT = new UserAction(UserActionType.Search, new Date(TEST_DATE_STRING), {
        origin_level_1: 'relevant' + Math.random(),
        cause: 'interfaceLoad',
    });

    const FAKE_USER_SEARCH_EVENT = new UserAction(UserActionType.Search, new Date(TEST_DATE_STRING), {
        origin_level_1: 'relevant' + Math.random(),
        query_expression: 'someSearch' + Math.random(),
        cause: 'searchboxSubmit',
    });
    FAKE_USER_SEARCH_EVENT.query = FAKE_USER_SEARCH_EVENT.raw.query_expression;

    const FAKE_VIEW_EVENT = new UserAction(UserActionType.PageView, new Date(TEST_DATE_STRING), {
        origin_level_1: 'relevant' + Math.random(),
        content_id_key: '@someKey' + Math.random(),
        content_id_value: 'someValue' + Math.random(),
    });

    const FAKE_CUSTOM_EVENT = new UserAction(UserActionType.Custom, new Date(TEST_DATE_STRING), {
        origin_level_1: 'relevant' + Math.random(),
        event_type: 'Submit' + Math.random(),
        event_value: 'Case Submit' + Math.random(),
    });

    const FAKE_CUSTOM_EVENT_WITHOUT_TYPE = new UserAction(UserActionType.Custom, new Date(TEST_DATE_STRING), {
        origin_level_1: 'relevant' + Math.random(),
        event_value: 'Case Submit' + Math.random(),
    });

    const IRRELEVANT_ACTIONS = [
        new UserAction(UserActionType.Search, new Date(TEST_DATE_STRING), {
            origin_level_1: 'not relevant' + Math.random(),
            query_expression: 'not relevant',
            cause: 'interfaceLoad',
        }),
        new UserAction(UserActionType.PageView, new Date(TEST_DATE_STRING), {
            origin_level_1: 'not relevant' + Math.random(),
            content_id_key: '@sysurihash',
            content_id_value: 'product1',
        }),
        new UserAction(UserActionType.Custom, new Date(TEST_DATE_STRING), {
            origin_level_1: 'not relevant' + Math.random(),
            c_contentidkey: '@sysurihash',
            c_contentidvalue: 'headphones-gaming',
            event_type: 'addPurchase',
            event_value: 'headphones-gaming',
        }),
        new UserAction(UserActionType.Custom, new Date(TEST_DATE_STRING), {
            origin_level_1: 'relevant' + Math.random(),
            c_contentidkey: '@sysurihash',
            c_contentidvalue: 'headphones-gaming',
            event_type: 'addPurchase',
            event_value: 'headphones-gaming',
        }),
    ];

    const FAKE_USER_ACTIONS = [
        new UserAction(UserActionType.Search, new Date(TEST_DATE_STRING), {
            origin_level_1: 'relevant' + Math.random(),
            cause: 'searchboxSubmit',
            query_expression: 'Best product',
        }),
        new UserAction(UserActionType.Click, new Date(TEST_DATE_STRING), {
            origin_level_1: 'relevant' + Math.random(),
            uri_hash: 'product' + Math.random(),
            c_contentidkey: '@sysurihash',
            c_contentidvalue: 'product1',
        }),
    ];

    const getMockComponent = async (returnedActions: UserAction | UserAction[], element = document.createElement('div')) => {
        const mock = Mock.advancedComponentSetup<UserActivity>(
            UserActivity,
            new Mock.AdvancedComponentSetupOptions(element, { userId: 'testuserId' }, (env) => {
                env.element = element;
                getActionsPromise = Promise.resolve(returnedActions);
                fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => getActionsPromise);
                return env;
            })
        );
        await getActionsPromise;
        return mock;
    };

    let sandbox: SinonSandbox;
    let getActionsPromise: Promise<any>;

    beforeAll(() => {
        sandbox = createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should show the starting date and time of the user action session', async () => {
        const mock = await getMockComponent(FAKE_USER_ACTIONS);
        const timestamps = FAKE_USER_ACTIONS.map((action) => action.timestamp).sort();

        const firstAction = timestamps[0];

        expect(mock.cmp.element.innerHTML).toMatch(formatDate(firstAction));
        expect(mock.cmp.element.innerHTML).toMatch(formatTime(firstAction));
    });

    it('should duration of the user action session', async () => {
        const mock = await getMockComponent(FAKE_USER_ACTIONS);
        const timestamps = FAKE_USER_ACTIONS.map((action) => action.timestamp).sort();

        expect(mock.cmp.element.innerHTML).toMatch(formatTimeInterval(timestamps[timestamps.length - 1].getTime() - timestamps[0].getTime()));
    });

    it('should fold each actions that are tagged as not meaningful', async () => {
        const mock = await getMockComponent([...FAKE_USER_ACTIONS, ...IRRELEVANT_ACTIONS]);

        IRRELEVANT_ACTIONS.forEach((action) => {
            expect(mock.cmp.element.querySelector(ACTIVITY_SELECTOR).innerHTML).not.toMatch(action.raw.origin_level_1);
        });
    });

    it('should show each actions that are tagged as meaningful', async () => {
        const mock = await getMockComponent([...FAKE_USER_ACTIONS, ...IRRELEVANT_ACTIONS]);

        FAKE_USER_ACTIONS.forEach((action) => {
            expect(mock.cmp.element.querySelector(ACTIVITY_SELECTOR).innerHTML).toMatch(action.raw.origin_level_1);
        });
    });

    it('should show all actions when no action are tagged as meaningful', async () => {
        const mock = await getMockComponent(IRRELEVANT_ACTIONS);

        IRRELEVANT_ACTIONS.forEach((action) => {
            expect(mock.cmp.element.querySelector(ACTIVITY_SELECTOR).innerHTML).toMatch(action.raw.origin_level_1);
        });
    });

    describe('folded events', () => {
        it('should unfold on click', async () => {
            const mock = await getMockComponent([...FAKE_USER_ACTIONS, ...IRRELEVANT_ACTIONS]);

            const folded = mock.cmp.element.querySelector<HTMLElement>('.coveo-folded');

            expect(folded).not.toBeNull();
            folded.click();
            IRRELEVANT_ACTIONS.forEach((action) => {
                expect(mock.cmp.element.querySelector(ACTIVITY_SELECTOR).innerHTML).toMatch(action.raw.origin_level_1);
            });
        });
    });

    describe('search event', () => {
        ['omniboxAnalytics', 'userActionsSubmit', 'omniboxFromLink', 'searchboxAsYouType', 'searchboxSubmit', 'searchFromLink'].map((cause) => {
            it(`should display the "User Query" as event title when there is a query expression and the cause is ${cause}`, async () => {
                const mock = await getMockComponent([
                    new UserAction(UserActionType.Search, new Date(TEST_DATE_STRING), {
                        origin_level_1: 'relevant' + Math.random(),
                        query_expression: 'someSearch' + Math.random(),
                        cause: cause,
                    }),
                ]);

                const clickElement = mock.cmp.element.querySelector('.coveo-search');

                const action = await mock.cmp['userProfileModel'].getActions('');

                expect(action[0].raw.cause).toBe(cause);
                expect(clickElement).not.toBeNull();
                expect(clickElement.querySelector<HTMLElement>(ACTIVITY_TITLE_SELECTOR).innerText).toBe('User Query');
            });
        });

        it('should display the "Query" as event title', async () => {
            const mock = await getMockComponent([FAKE_SEARCH_EVENT]);

            const clickElement = mock.cmp.element.querySelector('.coveo-search');

            expect(clickElement).not.toBeNull();
            expect(clickElement.querySelector<HTMLElement>(ACTIVITY_TITLE_SELECTOR).innerText).toBe('Query');
        });

        it('should display the query made by the user as event data', async () => {
            const mock = await getMockComponent([FAKE_USER_SEARCH_EVENT]);

            const clickElement = mock.cmp.element.querySelector('.coveo-search');

            expect(clickElement).not.toBeNull();
            expect(clickElement.querySelector<HTMLElement>('.coveo-data').innerText).toBe(FAKE_USER_SEARCH_EVENT.query);
        });

        it('should display the time of the event', async () => {
            const mock = await getMockComponent([FAKE_SEARCH_EVENT]);

            const searchElement = mock.cmp.element.querySelector('.coveo-search');

            expect(searchElement).not.toBeNull();
            expect(searchElement.querySelector<HTMLElement>(ACTIVIY_TIMESTAMP_SELECTOR).innerText).toMatch(
                formatDateAndTimeShort(FAKE_SEARCH_EVENT.timestamp)
            );
        });

        it('should display the time of the event in long format if in a wider interface', async () => {
            const element = document.createElement('div');
            Object.defineProperties(element, {
                offsetWidth: {
                    get() {
                        return '500';
                    },
                },
            });

            const mock = await getMockComponent([FAKE_SEARCH_EVENT], element);

            const searchElement = mock.cmp.element.querySelector('.coveo-search');
            expect(searchElement).not.toBeNull();
            expect(searchElement.querySelector<HTMLElement>(ACTIVIY_TIMESTAMP_SELECTOR).innerText).toMatch(
                formatDateAndTime(FAKE_SEARCH_EVENT.timestamp)
            );
        });

        it('should display the originLevel1 as event footer', async () => {
            const mock = await getMockComponent([FAKE_SEARCH_EVENT]);

            const clickElement = mock.cmp.element.querySelector('.coveo-search');

            expect(clickElement).not.toBeNull();
            expect(clickElement.querySelector<HTMLElement>('.coveo-footer').innerText).toMatch(FAKE_SEARCH_EVENT.raw.origin_level_1);
        });
    });

    describe('click event', () => {
        it('should display the "Clicked Document" as event title', async () => {
            const mock = await getMockComponent([FAKE_CLICK_EVENT]);

            const clickElement = mock.cmp.element.querySelector('.coveo-click');

            expect(clickElement).not.toBeNull();
            expect(clickElement.querySelector<HTMLElement>(ACTIVITY_TITLE_SELECTOR).innerText).toBe('Clicked Document');
        });

        it('should display a link to the clicked document as event data', async () => {
            const mock = await getMockComponent([FAKE_CLICK_EVENT]);

            const clickElement = mock.cmp.element.querySelector('.coveo-click');

            expect(clickElement).not.toBeNull();
            expect(clickElement.querySelector<HTMLAnchorElement>('.coveo-data') instanceof HTMLAnchorElement).toBe(true);
            expect(clickElement.querySelector<HTMLAnchorElement>('.coveo-data').innerText).toBe(FAKE_CLICK_EVENT.document.title);
            expect(clickElement.querySelector<HTMLAnchorElement>('.coveo-data').href).toMatch(FAKE_CLICK_EVENT.document.clickUri);
        });
        it('should display the time of the event', async () => {
            const mock = await getMockComponent([FAKE_CLICK_EVENT]);

            const clickElement = mock.cmp.element.querySelector('.coveo-click');

            expect(clickElement).not.toBeNull();
            expect(clickElement.querySelector<HTMLElement>(ACTIVIY_TIMESTAMP_SELECTOR).innerText).toMatch(
                formatDateAndTimeShort(FAKE_CLICK_EVENT.timestamp)
            );
        });

        it('should display the time of the event in long format if in a wider interface', async () => {
            const element = document.createElement('div');
            Object.defineProperties(element, {
                offsetWidth: {
                    get() {
                        return '500';
                    },
                },
            });

            const mock = await getMockComponent([FAKE_CLICK_EVENT], element);

            const searchElement = mock.cmp.element.querySelector('.coveo-click');
            expect(searchElement).not.toBeNull();
            expect(searchElement.querySelector<HTMLElement>(ACTIVIY_TIMESTAMP_SELECTOR).innerText).toMatch(
                formatDateAndTime(FAKE_CLICK_EVENT.timestamp)
            );
        });

        it('should display the originLevel1 as event footer', async () => {
            const mock = await getMockComponent([FAKE_CLICK_EVENT]);

            const clickElement = mock.cmp.element.querySelector('.coveo-click');

            expect(clickElement).not.toBeNull();
            expect(clickElement.querySelector<HTMLElement>('.coveo-footer').innerText).toMatch(FAKE_CLICK_EVENT.raw.origin_level_1);
        });
    });

    describe('page view event', () => {
        it('should display the "Page View" as event title', async () => {
            const mock = await getMockComponent([FAKE_VIEW_EVENT]);

            const viewElement = mock.cmp.element.querySelector('.coveo-view');

            expect(viewElement).not.toBeNull();
            expect(viewElement.querySelector<HTMLElement>(ACTIVITY_TITLE_SELECTOR).innerText).toBe('Page View');
        });

        it('should display the content id key and value as event data', async () => {
            const mock = await getMockComponent([FAKE_VIEW_EVENT]);

            const viewElement = mock.cmp.element.querySelector('.coveo-view');

            expect(viewElement).not.toBeNull();
            expect(viewElement.querySelector<HTMLElement>('.coveo-data').innerText).toMatch(FAKE_VIEW_EVENT.raw.content_id_key);
            expect(viewElement.querySelector<HTMLElement>('.coveo-data').innerText).toMatch(FAKE_VIEW_EVENT.raw.content_id_value);
        });

        it('should display the time of the event', async () => {
            const mock = await getMockComponent([FAKE_VIEW_EVENT]);

            const viewElement = mock.cmp.element.querySelector('.coveo-view');

            expect(viewElement).not.toBeNull();
            expect(viewElement.querySelector<HTMLElement>(ACTIVIY_TIMESTAMP_SELECTOR).innerText).toMatch(
                formatDateAndTimeShort(FAKE_VIEW_EVENT.timestamp)
            );
        });

        it('should display the time of the event in long format if in a wider interface', async () => {
            const element = document.createElement('div');
            Object.defineProperties(element, {
                offsetWidth: {
                    get() {
                        return '500';
                    },
                },
            });

            const mock = await getMockComponent([FAKE_VIEW_EVENT], element);

            const searchElement = mock.cmp.element.querySelector('.coveo-view');
            expect(searchElement).not.toBeNull();
            expect(searchElement.querySelector<HTMLElement>(ACTIVIY_TIMESTAMP_SELECTOR).innerText).toMatch(
                formatDateAndTime(FAKE_VIEW_EVENT.timestamp)
            );
        });

        it('should display the originLevel1 as event footer', async () => {
            const mock = await getMockComponent([FAKE_VIEW_EVENT]);

            const viewElement = mock.cmp.element.querySelector('.coveo-view');

            expect(viewElement).not.toBeNull();
            expect(viewElement.querySelector<HTMLElement>('.coveo-footer').innerText).toMatch(FAKE_VIEW_EVENT.raw.origin_level_1);
        });
    });

    describe('custom event', () => {
        it('should display the event type as event title', async () => {
            const mock = await getMockComponent([FAKE_CUSTOM_EVENT]);

            const clickElement = mock.cmp.element.querySelector('.coveo-custom');

            expect(clickElement).not.toBeNull();
            expect(clickElement.querySelector<HTMLElement>(ACTIVITY_TITLE_SELECTOR).innerText).toBe(FAKE_CUSTOM_EVENT.raw.event_type);
        });

        it('should display "Custom Action" as event title when the event type is unavailable', async () => {
            const mock = await getMockComponent([FAKE_CUSTOM_EVENT_WITHOUT_TYPE]);

            const clickElement = mock.cmp.element.querySelector('.coveo-custom');

            expect(clickElement).not.toBeNull();
            expect(clickElement.querySelector<HTMLElement>(ACTIVITY_TITLE_SELECTOR).innerText).toBe('Custom Action');
        });

        it('should display the event value as event data', async () => {
            const mock = await getMockComponent([FAKE_CUSTOM_EVENT]);

            const clickElement = mock.cmp.element.querySelector('.coveo-custom');

            expect(clickElement).not.toBeNull();
            expect(clickElement.querySelector<HTMLElement>('.coveo-data').innerText).toBe(FAKE_CUSTOM_EVENT.raw.event_value);
        });

        it('should display the time of the event', async () => {
            const mock = await getMockComponent([FAKE_CUSTOM_EVENT]);

            const clickElement = mock.cmp.element.querySelector('.coveo-custom');

            expect(clickElement).not.toBeNull();
            expect(clickElement.querySelector<HTMLElement>(ACTIVIY_TIMESTAMP_SELECTOR).innerText).toMatch(
                formatDateAndTimeShort(FAKE_CUSTOM_EVENT.timestamp)
            );
        });

        it('should display the time of the event in long format if in a wider interface', async () => {
            const element = document.createElement('div');
            Object.defineProperties(element, {
                offsetWidth: {
                    get() {
                        return '500';
                    },
                },
            });

            const mock = await getMockComponent([FAKE_CUSTOM_EVENT], element);

            const searchElement = mock.cmp.element.querySelector('.coveo-custom');
            expect(searchElement).not.toBeNull();
            expect(searchElement.querySelector<HTMLElement>(ACTIVIY_TIMESTAMP_SELECTOR).innerText).toMatch(
                formatDateAndTime(FAKE_CUSTOM_EVENT.timestamp)
            );
        });

        it('should display the originLevel1 as event footer', async () => {
            const mock = await getMockComponent([FAKE_CUSTOM_EVENT]);

            const clickElement = mock.cmp.element.querySelector('.coveo-custom');

            expect(clickElement).not.toBeNull();
            expect(clickElement.querySelector<HTMLElement>('.coveo-footer').innerText).toMatch(FAKE_CUSTOM_EVENT.raw.origin_level_1);
        });

        it('Should disable itself when the userId is falsey', () => {
            let getActionStub: SinonStub<[HTMLElement, UserActivity], void>;
            const mock = Mock.advancedComponentSetup<UserActivity>(
                UserActivity,
                new Mock.AdvancedComponentSetupOptions(null, { userId: null }, (env) => {
                    getActionStub = fakeUserProfileModel(env.root, sandbox).getActions;
                    return env;
                })
            );

            expect(getActionStub.called).toBe(false);
            expect(mock.cmp.disabled).toBe(true);
        });

        it('Should disable itself when the userId is empty string', () => {
            let getActionStub: SinonStub<[HTMLElement, UserActivity], void>;
            const mock = Mock.advancedComponentSetup<UserActivity>(
                UserActivity,
                new Mock.AdvancedComponentSetupOptions(null, { userId: '' }, (env) => {
                    getActionStub = fakeUserProfileModel(env.root, sandbox).getActions;
                    return env;
                })
            );

            expect(getActionStub.called).toBe(false);
            expect(mock.cmp.disabled).toBe(true);
        });
    });
});
