import { SinonSandbox, createSandbox, SinonStub } from 'sinon';
import { UserAction } from '../../../src/models/UserProfileModel';
import { Fake, Mock } from 'coveo-search-ui-tests';
import { UserActionType } from '../../../src/rest/UserProfilingEndpoint';
import { UserActivity } from '../../../src/Index';
import { fakeUserProfileModel } from '../../utils';
import { formatDate, formatTime } from '../../../src/utils/time';

describe('UserActivity', () => {
    const TEST_DATE_TIME = 1642443657767;
    const TEST_DATE = new Date(TEST_DATE_TIME);
    const FAKE_ORIGIN_1 = 'origin1';
    const FAKE_DOCUMENT_TITLE = 'Martine a la plage';
    const MINUTE = 60000;

    const FAKE_EVENT_SEARCH = new UserAction(
        UserActionType.Search,
        TEST_DATE,
        { cause: 'searchFromLink', origin_level_1: FAKE_ORIGIN_1, query_expression: 'foo' },
        null,
        'foo'
    );
    const FAKE_EVENT_CLICK = new UserAction(UserActionType.Click, new Date(TEST_DATE.getTime() + 1 * MINUTE), {
        c_contentidkey: 'permanentid',
        c_contentidvalue: 'somepermanentid',
        origin_level_1: FAKE_ORIGIN_1,
        title: FAKE_DOCUMENT_TITLE,
        uri_hash: 'whatever',
    });
    FAKE_EVENT_CLICK.document = Fake.createFakeResult();
    const FAKE_EVENT_CUSTOM = new UserAction(UserActionType.Custom, new Date(TEST_DATE.getTime() + 2 * MINUTE), {
        event_type: 'case',
        event_value: 'caseDetach',
        origin_level_1: FAKE_ORIGIN_1,
    });
    const FAKE_EVENT_VIEW = new UserAction(UserActionType.PageView, new Date(TEST_DATE.getTime() + 3 * MINUTE), {
        content_id_key: '@clickableuri',
        content_id_value: 'whatever',
        title: 'Home',
        origin_level_1: FAKE_ORIGIN_1,
    });

    const FAKE_USER_ACTIONS_SESSION = [FAKE_EVENT_SEARCH, FAKE_EVENT_CLICK, FAKE_EVENT_CUSTOM, FAKE_EVENT_VIEW];

    const SESSION_SELECTOR = 'div.coveo-session-container';
    const SESSION_HEADER_SELECTOR = 'div.coveo-session-header';
    const SESSION_ACTIONS_SELECTOR = 'div.coveo-session-container > li.coveo-action';
    const TICKET_CREATED_ACTION_SELECTOR = 'li.coveo-case-creation-action';
    const ACTION_FOOTER_SELECTOR = 'div.coveo-footer';
    const ACTION_TITLE_SELECTOR = '.coveo-activity-title';
    const ACTION_SEARCH_SELECTOR = 'li.coveo-action.coveo-search';
    const ACTION_CLICK_SELECTOR = 'li.coveo-action.coveo-click';
    const ACTION_CUSTOM_SELECTOR = 'li.coveo-action.coveo-custom';
    const ACTION_VIEW_SELECTOR = 'li.coveo-action.coveo-view';
    const FOLDED_ACTIONS_SELECTOR = 'li.coveo-folded-actions';
    const FOLDED_SESSIONS_SELECTOR = 'ol.coveo-activity > li.coveo-folded';

    const getMockComponent = async (
        returnedActions: UserAction | UserAction[],
        ticketCreationDateTime: Date | string | number,
        customActionsExclude: string[] | null = null,
        element = document.createElement('div')
    ) => {
        const mock = Mock.advancedComponentSetup<UserActivity>(
            UserActivity,
            new Mock.AdvancedComponentSetupOptions(
                element,
                { userId: 'testuserId', ticketCreationDateTime: ticketCreationDateTime, customActionsExclude: customActionsExclude },
                (env) => {
                    env.element = element;
                    getActionsPromise = Promise.resolve(returnedActions);
                    fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => getActionsPromise);
                    return env;
                }
            )
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

    describe('sessions', () => {
        it('should regroup actions in the same session', async () => {
            const mock = await getMockComponent(FAKE_USER_ACTIONS_SESSION, null);

            const sessionHeaders = mock.cmp.element.querySelectorAll(SESSION_HEADER_SELECTOR);
            expect(sessionHeaders.length).toEqual(1);
        });

        it('should display a header with the date of the most recent action in the session', async () => {
            const mock = await getMockComponent(FAKE_USER_ACTIONS_SESSION, null);
            const expectedDate = FAKE_USER_ACTIONS_SESSION.map((action) => action.timestamp).sort((a, b) => b.getTime() - a.getTime())[0];
            const expectedSessionHeader = `Session ${formatDate(expectedDate)}`;

            const sessionHeaders = mock.cmp.element.querySelectorAll(SESSION_HEADER_SELECTOR);
            expect(sessionHeaders.length).toEqual(1);
            expect(sessionHeaders[0].innerHTML).toMatch(expectedSessionHeader);
        });

        it('should display the correct number of actions and in the correct order', async () => {
            const mock = await getMockComponent(FAKE_USER_ACTIONS_SESSION, null);
            const sortedActions = FAKE_USER_ACTIONS_SESSION.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

            const sessionActions = mock.cmp.element.querySelectorAll(SESSION_ACTIONS_SELECTOR);
            expect(sessionActions.length).toEqual(FAKE_USER_ACTIONS_SESSION.length);
            sortedActions.forEach((action, index) => {
                const expectedTime = `${formatTime(action.timestamp)}`;
                expect(sessionActions[index].querySelector(ACTION_FOOTER_SELECTOR).innerHTML).toMatch(expectedTime);
            });
        });

        it('should display a link to show a past session', async () => {
            const secondSession = FAKE_USER_ACTIONS_SESSION.map((action) => ({
                ...action,
                timestamp: new Date(action.timestamp.getTime() + 60 * MINUTE),
            }));
            const thirdSession = FAKE_USER_ACTIONS_SESSION.map((action) => ({
                ...action,
                timestamp: new Date(action.timestamp.getTime() + 120 * MINUTE),
            }));

            const mock = await getMockComponent([...FAKE_USER_ACTIONS_SESSION, ...secondSession, ...thirdSession], null);

            const foldedSessionLink = mock.cmp.element.querySelectorAll(FOLDED_SESSIONS_SELECTOR);
            expect(foldedSessionLink.length).toBe(1);
        });

        it('should expand a new session when clicking on the link to show a past session', async () => {
            const secondSession = FAKE_USER_ACTIONS_SESSION.map((action) => ({
                ...action,
                timestamp: new Date(action.timestamp.getTime() + 60 * MINUTE),
            }));
            const thirdSession = FAKE_USER_ACTIONS_SESSION.map((action) => ({
                ...action,
                timestamp: new Date(action.timestamp.getTime() + 120 * MINUTE),
            }));

            const mock = await getMockComponent([...FAKE_USER_ACTIONS_SESSION, ...secondSession, ...thirdSession], null);

            const visibleSessionsBeforeClick = mock.cmp.element.querySelectorAll(SESSION_SELECTOR);
            expect(visibleSessionsBeforeClick.length).toBe(1);

            const foldedSessionLink = mock.cmp.element.querySelector<HTMLElement>(FOLDED_SESSIONS_SELECTOR);
            foldedSessionLink.click();

            const visibleSessionsAfterClick = mock.cmp.element.querySelectorAll(SESSION_SELECTOR);
            expect(visibleSessionsAfterClick.length).toBe(2);
        });

        it('should remove the link to show past session when no more sessions can be shown', async () => {
            const secondSession = FAKE_USER_ACTIONS_SESSION.map((action) => ({
                ...action,
                timestamp: new Date(action.timestamp.getTime() + 60 * MINUTE),
            }));
            const thirdSession = FAKE_USER_ACTIONS_SESSION.map((action) => ({
                ...action,
                timestamp: new Date(action.timestamp.getTime() + 120 * MINUTE),
            }));

            const mock = await getMockComponent([...FAKE_USER_ACTIONS_SESSION, ...secondSession, ...thirdSession], null);

            const visibleSessionsBeforeClick = mock.cmp.element.querySelectorAll(SESSION_SELECTOR);
            expect(visibleSessionsBeforeClick.length).toBe(1);

            let foldedSessionLink = mock.cmp.element.querySelector<HTMLElement>(FOLDED_SESSIONS_SELECTOR);
            foldedSessionLink.click();
            foldedSessionLink = mock.cmp.element.querySelector<HTMLElement>(FOLDED_SESSIONS_SELECTOR);
            foldedSessionLink.click();

            const visibleSessionsAfterClick = mock.cmp.element.querySelectorAll(SESSION_SELECTOR);
            expect(visibleSessionsAfterClick.length).toBe(3);

            const foldedSessionLinkAfterClick = mock.cmp.element.querySelectorAll(FOLDED_SESSIONS_SELECTOR);
            expect(foldedSessionLinkAfterClick.length).toBe(0);
        });

        describe('with a ticket creation date', () => {
            it('should not contain a Ticket Created event when the ticket creation date is too old', async () => {
                const ticketCreationDate = new Date(TEST_DATE.getTime() - 60 * MINUTE);
                const mock = await getMockComponent(FAKE_USER_ACTIONS_SESSION, ticketCreationDate);

                const sessionActions = mock.cmp.element.querySelectorAll(SESSION_ACTIONS_SELECTOR);

                expect(sessionActions.length).toBe(FAKE_USER_ACTIONS_SESSION.length);
                expect(mock.cmp.element.querySelectorAll(TICKET_CREATED_ACTION_SELECTOR).length).toBe(0);
            });

            it('should create a virtual session when the ticket creation date is too recent compared to the most recent session', async () => {
                const ticketCreationDate = new Date(TEST_DATE.getTime() + 60 * MINUTE);
                const mock = await getMockComponent(FAKE_USER_ACTIONS_SESSION, ticketCreationDate);

                const sessionActions = mock.cmp.element.querySelectorAll(SESSION_ACTIONS_SELECTOR);

                expect(sessionActions.length).toBe(1);
                expect(mock.cmp.element.querySelectorAll(TICKET_CREATED_ACTION_SELECTOR).length).toBe(1);
            });

            it('should become the most recent action in a session that occured within 30 minutes', async () => {
                const ticketCreationDate = new Date(TEST_DATE.getTime() + 4 * MINUTE);
                const mock = await getMockComponent(FAKE_USER_ACTIONS_SESSION, ticketCreationDate);

                const sessionActions = mock.cmp.element.querySelectorAll(SESSION_ACTIONS_SELECTOR);
                expect(sessionActions.length).toBe(FAKE_USER_ACTIONS_SESSION.length + 1);
                expect(mock.cmp.element.querySelectorAll(TICKET_CREATED_ACTION_SELECTOR).length).toBe(1);
                expect(sessionActions[0].innerHTML).toMatch('Ticket Created');
            });

            it('should display folded actions for actions that occured after the ticket creation within a session', async () => {
                const ticketCreationDate = new Date(TEST_DATE.getTime() + 2.1 * MINUTE);
                const mock = await getMockComponent(FAKE_USER_ACTIONS_SESSION, ticketCreationDate);

                const sessionActions = mock.cmp.element.querySelectorAll(SESSION_ACTIONS_SELECTOR);
                expect(sessionActions.length).toBe(4);
                expect(sessionActions[0].innerHTML).toMatch('Ticket Created');
            });

            it('should display a link to expand actions after the ticket creation within a session', async () => {
                const ticketCreationDate = new Date(TEST_DATE.getTime() + 2.1 * MINUTE);
                const mock = await getMockComponent(FAKE_USER_ACTIONS_SESSION, ticketCreationDate);

                const foldedActions = mock.cmp.element.querySelectorAll(FOLDED_ACTIONS_SELECTOR);
                expect(foldedActions.length).toBe(1);
            });

            it('should expand the folded actions when clicking on the more actions link', async () => {
                const ticketCreationDate = new Date(TEST_DATE.getTime() + 2.1 * MINUTE);
                const mock = await getMockComponent(FAKE_USER_ACTIONS_SESSION, ticketCreationDate);

                const sessionActionsBeforeClick = mock.cmp.element.querySelectorAll(SESSION_ACTIONS_SELECTOR);
                expect(sessionActionsBeforeClick.length).toBe(4);
                const foldedActions = mock.cmp.element.querySelector<HTMLElement>(FOLDED_ACTIONS_SELECTOR);
                foldedActions.click();

                const sessionActionsAfterClick = mock.cmp.element.querySelectorAll(SESSION_ACTIONS_SELECTOR);
                expect(sessionActionsAfterClick.length).toBe(5);
            });

            it('should show links to view sessions before and after the ticket creation session', async () => {
                const moreRecentSession = FAKE_USER_ACTIONS_SESSION.map((action) => ({
                    ...action,
                    timestamp: new Date(action.timestamp.getTime() + 120 * MINUTE),
                }));
                const ticketCreationDate = new Date(TEST_DATE.getTime() + 60 * MINUTE);
                const mock = await getMockComponent([...moreRecentSession, ...FAKE_USER_ACTIONS_SESSION], ticketCreationDate);

                const foldedSessionLink = mock.cmp.element.querySelectorAll(FOLDED_SESSIONS_SELECTOR);
                expect(foldedSessionLink.length).toBe(2);
            });

            it('should expand the session before the ticket creation session when clicking on "Show new session"', async () => {
                const moreRecentSession = FAKE_USER_ACTIONS_SESSION.map((action) => ({
                    ...action,
                    timestamp: new Date(action.timestamp.getTime() + 120 * MINUTE),
                }));
                const ticketCreationDate = new Date(TEST_DATE.getTime() + 60 * MINUTE);
                const mock = await getMockComponent([...moreRecentSession, ...FAKE_USER_ACTIONS_SESSION], ticketCreationDate);

                const foldedSessionLinkBeforeClick = mock.cmp.element.querySelector<HTMLElement>(FOLDED_SESSIONS_SELECTOR);
                expect(foldedSessionLinkBeforeClick.innerText).toMatch('Show new session');
                foldedSessionLinkBeforeClick.click();

                const sessionHeaders = mock.cmp.element.querySelectorAll(SESSION_HEADER_SELECTOR);
                expect(sessionHeaders.length).toBe(2);
            });

            it('should not display a link to show more sessions when all sessions have been expanded', async () => {
                const moreRecentSession = FAKE_USER_ACTIONS_SESSION.map((action) => ({
                    ...action,
                    timestamp: new Date(action.timestamp.getTime() + 120 * MINUTE),
                }));
                const ticketCreationDate = new Date(TEST_DATE.getTime() + 60 * MINUTE);
                const mock = await getMockComponent([...moreRecentSession, ...FAKE_USER_ACTIONS_SESSION], ticketCreationDate);

                const foldedSessionLinkBeforeSession = mock.cmp.element.querySelector<HTMLElement>(FOLDED_SESSIONS_SELECTOR);
                expect(foldedSessionLinkBeforeSession.innerText).toMatch('Show new session');
                foldedSessionLinkBeforeSession.click();

                const foldedSessionLinkAfterSession = mock.cmp.element.querySelector<HTMLElement>(FOLDED_SESSIONS_SELECTOR);
                expect(foldedSessionLinkAfterSession.innerText).toMatch('Show past session');
                foldedSessionLinkAfterSession.click();

                const foldedSessionLinks = mock.cmp.element.querySelectorAll(FOLDED_SESSIONS_SELECTOR);
                expect(foldedSessionLinks.length).toBe(0);
            });
        });
    });

    describe('actions', () => {
        describe('search', () => {
            it('should display the query as the action title', async () => {
                const mock = await getMockComponent([FAKE_EVENT_SEARCH], null);

                const actionsEl = mock.cmp.element.querySelectorAll(ACTION_SEARCH_SELECTOR);
                expect(actionsEl.length).toBe(1);
                const actionTitleEl = actionsEl[0].querySelector(ACTION_TITLE_SELECTOR);
                expect(actionTitleEl.innerHTML).toMatch(FAKE_EVENT_SEARCH.raw.query_expression);
            });

            it('should display the time of the action as footer', async () => {
                const mock = await getMockComponent([FAKE_EVENT_SEARCH], null);

                const actionEl = mock.cmp.element.querySelector<HTMLElement>(ACTION_SEARCH_SELECTOR);
                const actionFooter = actionEl.querySelector(ACTION_FOOTER_SELECTOR);
                expect(actionFooter.innerHTML).toMatch(`${formatTime(FAKE_EVENT_SEARCH.timestamp)}`);
            });

            it('should display the originLevel1 of the action as footer if available', async () => {
                const mock = await getMockComponent([FAKE_EVENT_SEARCH], null);

                const actionEl = mock.cmp.element.querySelector<HTMLElement>(ACTION_SEARCH_SELECTOR);
                const actionFooterEl = actionEl.querySelector(ACTION_FOOTER_SELECTOR);
                expect(actionFooterEl.innerHTML).toMatch(FAKE_EVENT_SEARCH.raw.origin_level_1);
            });
        });

        describe('click', () => {
            it('should display an anchor as the action title', async () => {
                const mock = await getMockComponent([FAKE_EVENT_CLICK], null);

                const actionsEl = mock.cmp.element.querySelectorAll(ACTION_CLICK_SELECTOR);
                expect(actionsEl.length).toBe(1);
                const actionTitleEl = actionsEl[0].querySelector<HTMLAnchorElement>(ACTION_TITLE_SELECTOR);
                expect(actionTitleEl instanceof HTMLAnchorElement).toBe(true);
                expect(actionTitleEl.innerText).toBe(FAKE_EVENT_CLICK.document.title);
                expect(actionTitleEl.href).toMatch(FAKE_EVENT_CLICK.document.clickUri);
            });

            it('should display the time of the action as footer', async () => {
                const mock = await getMockComponent([FAKE_EVENT_CLICK], null);

                const actionEl = mock.cmp.element.querySelector<HTMLElement>(ACTION_CLICK_SELECTOR);
                const actionFooterEl = actionEl.querySelector(ACTION_FOOTER_SELECTOR);
                expect(actionFooterEl.innerHTML).toMatch(`${formatTime(FAKE_EVENT_CLICK.timestamp)}`);
            });

            it('should display the originLevel1 of the action as footer if available', async () => {
                const mock = await getMockComponent([FAKE_EVENT_CLICK], null);

                const actionEl = mock.cmp.element.querySelector<HTMLElement>(ACTION_CLICK_SELECTOR);
                const actionFooterEl = actionEl.querySelector(ACTION_FOOTER_SELECTOR);
                expect(actionFooterEl.innerHTML).toMatch(FAKE_EVENT_CLICK.raw.origin_level_1);
            });
        });

        describe('pageview', () => {
            it('should display the title of the pageview action', async () => {
                const viewEvent = {
                    ...FAKE_EVENT_VIEW,
                    raw: {
                        ...FAKE_EVENT_VIEW.raw,
                        content_id_key: 'foo',
                    },
                };
                const mock = await getMockComponent([viewEvent], null);

                const actionsEl = mock.cmp.element.querySelectorAll(ACTION_VIEW_SELECTOR);
                expect(actionsEl.length).toBe(1);
                const actionTitleEl = actionsEl[0].querySelector<HTMLElement>(ACTION_TITLE_SELECTOR);
                expect(actionTitleEl.innerText).toBe(viewEvent.raw.title);
            });

            it('should display an anchor as the title of the pageview action when content_id_key is @clickableuri', async () => {
                const mock = await getMockComponent([FAKE_EVENT_VIEW], null);

                const actionsEl = mock.cmp.element.querySelectorAll(ACTION_VIEW_SELECTOR);
                expect(actionsEl.length).toBe(1);
                const actionTitleEl = actionsEl[0].querySelector<HTMLElement>('.coveo-activity-title-section');
                const customActionAnchorEl = actionTitleEl.firstElementChild as HTMLAnchorElement;
                expect(customActionAnchorEl instanceof HTMLAnchorElement).toBe(true);
                expect(customActionAnchorEl.innerText).toBe(FAKE_EVENT_VIEW.raw.title);
                expect(customActionAnchorEl.href).toMatch(FAKE_EVENT_VIEW.raw.content_id_value);
            });

            it('should display the time of the action as footer', async () => {
                const mock = await getMockComponent([FAKE_EVENT_VIEW], null);

                const actionEl = mock.cmp.element.querySelector<HTMLElement>(ACTION_VIEW_SELECTOR);
                const actionFooterEl = actionEl.querySelector(ACTION_FOOTER_SELECTOR);
                expect(actionFooterEl.innerHTML).toMatch(`${formatTime(FAKE_EVENT_VIEW.timestamp)}`);
            });

            it('should display the originLevel1 of the action as footer if available', async () => {
                const mock = await getMockComponent([FAKE_EVENT_VIEW], null);

                const actionEl = mock.cmp.element.querySelector<HTMLElement>(ACTION_VIEW_SELECTOR);
                const actionFooterEl = actionEl.querySelector(ACTION_FOOTER_SELECTOR);

                expect(actionFooterEl.innerHTML).toMatch(FAKE_EVENT_VIEW.raw.origin_level_1);
            });
        });

        describe('custom', () => {
            it('should display the event value as the title', async () => {
                const mock = await getMockComponent([FAKE_EVENT_CUSTOM], null);

                const actionsEl = mock.cmp.element.querySelectorAll(ACTION_CUSTOM_SELECTOR);
                expect(actionsEl.length).toBe(1);
                const actionTitleEl = actionsEl[0].querySelector(ACTION_TITLE_SELECTOR);
                expect(actionTitleEl.innerHTML).toMatch(FAKE_EVENT_CUSTOM.raw.event_value);
            });

            it('should fallback on the event type as the title if there are no event value', async () => {
                const customEventWithoutValue = {
                    ...FAKE_EVENT_CUSTOM,
                    raw: {
                        ...FAKE_EVENT_CUSTOM.raw,
                        event_value: '',
                    },
                };
                const mock = await getMockComponent([customEventWithoutValue], null);

                const actionsEl = mock.cmp.element.querySelectorAll(ACTION_CUSTOM_SELECTOR);
                expect(actionsEl.length).toBe(1);
                const actionTitleEl = actionsEl[0].querySelector(ACTION_TITLE_SELECTOR);
                expect(actionTitleEl.innerHTML).toMatch(customEventWithoutValue.raw.event_type);
            });

            it('should display the time of the action as footer', async () => {
                const mock = await getMockComponent([FAKE_EVENT_CUSTOM], null);

                const actionEl = mock.cmp.element.querySelector<HTMLElement>(ACTION_CUSTOM_SELECTOR);
                const actionFooter = actionEl.querySelector(ACTION_FOOTER_SELECTOR);
                expect(actionFooter.innerHTML).toMatch(`${formatTime(FAKE_EVENT_CUSTOM.timestamp)}`);
            });

            it('should display the originLevel1 of the action as footer if available', async () => {
                const mock = await getMockComponent([FAKE_EVENT_CUSTOM], null);

                const actionEl = mock.cmp.element.querySelector<HTMLElement>(ACTION_CUSTOM_SELECTOR);
                const actionFooterEl = actionEl.querySelector(ACTION_FOOTER_SELECTOR);
                expect(actionFooterEl.innerHTML).toMatch(FAKE_EVENT_CUSTOM.raw.origin_level_1);
            });

            describe('customActionsExclude option', () => {
                it('should exclude events respecting the default value', async () => {
                    const customEventShouldBeExcluded = {
                        ...FAKE_EVENT_CUSTOM,
                        raw: {
                            ...FAKE_EVENT_CUSTOM.raw,
                            event_value: 'ticket_field_update',
                        },
                    };
                    const customEventShouldNotBeExcluded = FAKE_EVENT_CUSTOM;

                    const mock = await getMockComponent([customEventShouldBeExcluded, customEventShouldNotBeExcluded], null);

                    const customActionsElements = mock.cmp.element.querySelectorAll<HTMLElement>(ACTION_CUSTOM_SELECTOR);
                    expect(customActionsElements.length).toBe(1);
                    const actionTitleEl = customActionsElements[0].querySelector(ACTION_TITLE_SELECTOR);
                    expect(actionTitleEl.innerHTML).toBe(FAKE_EVENT_CUSTOM.raw.event_value);
                });

                it('should respect changing the default values', async () => {
                    const customEventShouldBeExcluded = {
                        ...FAKE_EVENT_CUSTOM,
                        raw: {
                            ...FAKE_EVENT_CUSTOM.raw,
                            event_value: 'foo',
                        },
                    };

                    const customEventShouldNotBeExcluded = {
                        ...FAKE_EVENT_CUSTOM,
                        raw: {
                            ...FAKE_EVENT_CUSTOM.raw,
                            event_value: 'ticket_field_update',
                        },
                    };

                    const mock = await getMockComponent([customEventShouldBeExcluded, customEventShouldNotBeExcluded], null, ['foo']);

                    const customActionsElements = mock.cmp.element.querySelectorAll<HTMLElement>(ACTION_CUSTOM_SELECTOR);
                    expect(customActionsElements.length).toBe(1);
                    const actionTitleEl = customActionsElements[0].querySelector(ACTION_TITLE_SELECTOR);
                    expect(actionTitleEl.innerHTML).toBe('ticket_field_update');
                });
            });
        });
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
