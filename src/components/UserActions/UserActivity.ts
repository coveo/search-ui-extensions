import { Component, IComponentBindings, Initialization, ComponentOptions, l, get } from 'coveo-search-ui';
import { formatTime, formatDate } from '../../utils/time';
import { UserAction, UserProfileModel, UserActionSession } from '../../models/UserProfileModel';
import { duplicate, search, view, dot, flag } from '../../utils/icons';
import { UserActionType } from '../../rest/UserProfilingEndpoint';
import './Strings';

const DATE_TO_SECONDS = 1000;
const DATE_TO_MINUTES = 60;
const MAX_MINUTES_IN_SESSION = 30;

/**
 * Initialization options of the **UserActivity** class.
 */
export interface IUserActivityOptions {
    /**
     * Identifier of the user from which Clicked Documents are shown.
     *
     * **Require**
     */
    userId: string;

    /**
     * Identifies whenever the current Ticket was created to place the creation event in the timeline.
     * If it is provided, the timeline will focus on that event,
     * showing the session that corresponds to the date and time, if it is available, as well as 2 sessions more recent,
     * and 2 sessions prior to the case creation session.
     * If it is not provided or if the date is too old for the User Actions available,
     * the timeline will show the last 5 sessions available focusing on the most recent session.
     *
     * The format can either be
     * - an epoch number (number of milliseconds since January 1, 1970),
     * - a Date string that can be parsed by JavaScript's Date object
     * - a JavaScript Date
     */
    ticketCreationDateTime: Date;
}

const MAIN_CLASS = 'coveo-user-activity';
const ORIGIN_CLASS = 'coveo-footer';
const ACTIVITY_TITLE_SECTION = 'coveo-activity-title-section';
const ACTIVITY_TITLE_CLASS = 'coveo-activity-title';
const ACTIVITY_CLASS = 'coveo-activity';
const EVENT_CLASS = 'coveo-action';
const CLICK_EVENT_CLASS = 'coveo-click';
const SEARCH_EVENT_CLASS = 'coveo-search';
const CUSTOM_EVENT_CLASS = 'coveo-custom';
const VIEW_EVENT_CLASS = 'coveo-view';
const FOLDED_CLASS = 'coveo-folded';
const FOLDED_ACTIONS_CLASS = 'coveo-folded-actions';
const TEXT_CLASS = 'coveo-text';
const ICON_CLASS = 'coveo-icon';
const CASE_CREATION_ACTION_CLASS = 'coveo-case-creation-action';

export class UserActivity extends Component {
    static readonly ID = 'UserActivity';
    static readonly options: IUserActivityOptions = {
        userId: ComponentOptions.buildStringOption({ required: true }),
        ticketCreationDateTime: ComponentOptions.buildCustomOption<Date>((value: string) => UserActivity.parseDate(value), {
            required: false,
        }),
    };

    private static clickable_uri_ids = ['@clickableuri'];
    private sessions: UserActionSession[];
    private sessionsToDisplay: UserActionSession[];
    private caseSubmitSession: UserActionSession;
    private caseSubmitSessionIndex: number;
    private hasExpandedActions: boolean = false;
    private userProfileModel: UserProfileModel;

    /**
     * Create an instance of the **UserActivity** class. Initialize is needed the **UserProfileModel** and fetch user actions related to the **UserId**.
     *
     * @param element Element on which to bind the component.
     * @param options Initialization options of the component.
     * @param bindings Bindings of the Search-UI environment.
     */
    constructor(public element: HTMLElement, public options: IUserActivityOptions, public bindings: IComponentBindings) {
        super(element, UserActivity.ID, bindings);

        this.options = ComponentOptions.initComponentOptions(element, UserActivity, options);

        if (typeof this.options.ticketCreationDateTime === 'string' || typeof this.options.ticketCreationDateTime === 'number') {
            this.options.ticketCreationDateTime = UserActivity.parseDate(this.options.ticketCreationDateTime);
        }

        if (!this.options.userId) {
            this.disable();
            return;
        }

        this.userProfileModel = get(this.root, UserProfileModel) as UserProfileModel;

        this.userProfileModel.getActions(this.options.userId).then((actions) => {
            
            const sortedActions = actions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            this.sessions = this.splitActionsBySessions(sortedActions);

            this.buildSessionsToDisplay();

            this.render();
        });
    }

    public static parseDate(value: string | number): Date {
        try {
            return new Date(value);
        } catch (e) {
            console.warn(`Invalid date for ticket creation '${value}'`);
            return null;
        }
    }

    private isPartOfTheSameSession = (action: UserAction, previousDateTime: Date): boolean => {
        return (
            Math.abs(action.timestamp.valueOf() - previousDateTime.valueOf()) / DATE_TO_SECONDS / DATE_TO_MINUTES < MAX_MINUTES_IN_SESSION
        );
    };

    private splitActionsBySessions(actions: UserAction[]): UserActionSession[] {
        if (actions.length === 0) {
            return [];
        }
        let splitSessions: UserActionSession[] = [];
        splitSessions.push(new UserActionSession(actions[0].timestamp, []));
        let previousDateTime = actions[0]?.timestamp;
        let currentSession: UserActionSession = splitSessions[0];
        actions.forEach((action) => {
            if (this.isPartOfTheSameSession(action, previousDateTime)) {
                currentSession.actions.push(action);
            } else {
                splitSessions.push(new UserActionSession(action.timestamp, [action]));
                currentSession = splitSessions[splitSessions.length - 1];
            }
            previousDateTime = action.timestamp;
        });
        return splitSessions;
    }

    private buildSessionsToDisplay() {
        if (this.options.ticketCreationDateTime instanceof Date) {
            ({ caseSubmitSessionIndex: this.caseSubmitSessionIndex, caseSubmitSession: this.caseSubmitSession } = this.findCaseSubmitSession());
            if (this.caseSubmitSessionIndex !== -1) {
                this.sessionsToDisplay = this.findSurroundingSessions();
                this.caseSubmitSession.expanded = true;

                const insertTicketCreatedIndex = this.caseSubmitSession.actions.findIndex(
                    (action) => action.timestamp <= this.options.ticketCreationDateTime
                );
                this.caseSubmitSession.actions.splice(insertTicketCreatedIndex, 0, this.buildTicketCreatedAction());
                return;
            } else {
                console.warn(`Could not find a user action session corresponding to this date: ${this.options.ticketCreationDateTime}.`);
            }
        }
        this.sessionsToDisplay = this.sessions.slice(0, 5);
        this.sessionsToDisplay[0].expanded = true;
    }

    private buildTicketCreatedAction(): UserAction {
        return new UserAction(
            UserActionType.TicketCreated,
            this.options.ticketCreationDateTime,
            {},
        );
    }

    private findCaseSubmitSession(): { caseSubmitSessionIndex: number; caseSubmitSession: UserActionSession } {
        const caseSubmitSessionIndex = this.sessions.findIndex(
            (session) =>
                session.actions[0]?.timestamp >= this.options.ticketCreationDateTime &&
                session.actions[session.actions.length - 1]?.timestamp <= this.options.ticketCreationDateTime
        );
        const caseSubmitSession = this.sessions[caseSubmitSessionIndex];

        if (caseSubmitSessionIndex !== -1) {
            // If we found a session that correctly includes the timestamp when the ticket was created
            return { caseSubmitSessionIndex, caseSubmitSession };
        }

        // If we didn't, we can try to find a session that occured just before the ticket create.
        const potentialSessionBeforeIndex = this.sessions.findIndex((session) => session.actions[0]?.timestamp <= this.options.ticketCreationDateTime);

        if (potentialSessionBeforeIndex !== -1) {
            if (this.isPartOfTheSameSession(this.sessions[potentialSessionBeforeIndex].actions[0], this.options.ticketCreationDateTime)) {
                return { caseSubmitSessionIndex: potentialSessionBeforeIndex, caseSubmitSession: this.sessions[potentialSessionBeforeIndex] };
            }

            // If the session before the ticket create is not part of the same session, create a standalone session.
            this.sessions.splice(potentialSessionBeforeIndex, 0, new UserActionSession(this.options.ticketCreationDateTime, []));
            
            return { caseSubmitSessionIndex: potentialSessionBeforeIndex, caseSubmitSession: this.sessions[potentialSessionBeforeIndex] };
        }
        return { caseSubmitSessionIndex: -1, caseSubmitSession: null };
    }

    private findSurroundingSessions(): UserActionSession[] {
        return this.sessions.slice(Math.max(0, this.caseSubmitSessionIndex - 2), Math.min(this.caseSubmitSessionIndex + 3, this.sessions.length));
    }

    private render() {
        this.element.innerHTML = '';

        const panel = document.createElement('div');
        panel.classList.add(MAIN_CLASS);

        const activitySection = this.buildActivitySection();
        activitySection.classList.add(ACTIVITY_CLASS);

        panel.appendChild(activitySection);
        this.element.appendChild(panel);
    }

    private buildActivitySection(): HTMLElement {
        const list = document.createElement('ol');

        this.buildSessionsItems(this.sessionsToDisplay).forEach((sessionItem) => {
            if (sessionItem) {
                list.appendChild(sessionItem);
            }
        });

        return list;
    }

    private buildSessionsItems(sessions: UserActionSession[]): HTMLElement[] {
        let hitExpanded = false;

        const htmlElements: any[] = [];

        sessions.forEach((session, index) => {
            if (session.expanded) {
                htmlElements.push(this.buildSessionItem(session));
                hitExpanded = true;
            } else {
                if (!hitExpanded && sessions[index + 1]?.expanded) {
                    htmlElements.push(this.buildFoldedSession(session, 'Show new session'));
                }
                if (hitExpanded && sessions[index - 1]?.expanded) {
                    htmlElements.push(this.buildFoldedSession(session, 'Show past session'));
                }
            }
        });

        return htmlElements;
    }

    private buildFoldedSession(sessionToExpand: UserActionSession, showMoreButtonText: string): HTMLLIElement {
        const li = document.createElement('li');
        li.classList.add(FOLDED_CLASS);

        const hr = document.createElement('hr');
        const span = document.createElement('span');
        span.classList.add(TEXT_CLASS);
        span.innerText = showMoreButtonText || 'Show More';

        hr.appendChild(span);

        li.addEventListener('click', () => {
            sessionToExpand.expanded = true;
            this.render();
        });

        li.appendChild(hr);

        return li;
    }

    private buildSessionItem(session: UserActionSession): HTMLElement {
        if (session.actions.length === 0) {
            return null;
        }

        const sessionContainer = document.createElement('div');
        sessionContainer.classList.add('coveo-session-container');
        sessionContainer.appendChild(this.buildSessionHeader(session));

        this.buildSessionContent(session.actions, session === this.caseSubmitSession).forEach((actionHTML) =>
            sessionContainer.appendChild(actionHTML)
        );
        return sessionContainer;
    }

    private buildSessionHeader(session: UserActionSession): HTMLElement {
        const sessionHeader = document.createElement('div');
        sessionHeader.classList.add('coveo-session-header');
        sessionHeader.innerText = `Session ${formatDate(session.timestamp)}`;
        return sessionHeader;
    }

    private buildSessionContent(actions: UserAction[], withFolded: boolean): HTMLLIElement[] {
        let actionsHTML = [];
        let actionsToDisplay = actions;
        if (withFolded && this.options.ticketCreationDateTime && !this.hasExpandedActions) {
            actionsToDisplay = actionsToDisplay.filter((action) => action.timestamp <= this.options.ticketCreationDateTime);
            if (actionsToDisplay.length < actions.length) {
                actionsHTML.push(this.buildFoldedActions());
            }
        }
        actionsHTML = actionsHTML.concat(actionsToDisplay.map((action) => this.buildActionListItem(action)));
        return actionsHTML;
    }

    private buildFoldedActions(): HTMLLIElement {
        const li = document.createElement('li');
        li.classList.add(FOLDED_ACTIONS_CLASS);

        const span = document.createElement('span');
        span.classList.add(TEXT_CLASS);
        span.innerText = 'More actions';

        li.addEventListener('click', () => {
            this.hasExpandedActions = true;
            this.render();
        });

        for (let i = 0; i < 3; i++) {
            const el = this.buildIcon(dot);
            li.appendChild(el);
        }

        li.appendChild(span);
        return li;
    }

    private buildActionListItem(action: UserAction): HTMLLIElement {
        let li: HTMLLIElement;

        switch (action.type) {
            case UserActionType.Click:
                li = this.buildClickEvent(action);
                break;
            case UserActionType.Search:
                li = this.buildSearchEvent(action);
                break;
            case UserActionType.PageView:
                li = this.buildViewEvent(action);
                break;
            case UserActionType.TicketCreated:
                li = this.buildTicketCreated(action);
                break;
            default:
            case UserActionType.Custom:
                li = this.buildCustomEvent(action);
                break;
        }
        return li;
    }

    private buildSearchEvent(action: UserAction): HTMLLIElement {
        const li = document.createElement('li');
        li.classList.add(EVENT_CLASS, SEARCH_EVENT_CLASS);

        li.appendChild(this.buildTitleSection(action, action.query || 'Empty Search'));
        li.appendChild(this.buildFooterElement(action));
        li.appendChild(this.buildIcon(search));

        return li;
    }

    private buildClickEvent(action: UserAction): HTMLLIElement {
        const li = document.createElement('li');
        li.classList.add(EVENT_CLASS, CLICK_EVENT_CLASS);

        const titleSection = document.createElement('div');
        titleSection.classList.add(ACTIVITY_TITLE_SECTION);

        const clickedURLElement = document.createElement('a');
        clickedURLElement.classList.add(ACTIVITY_TITLE_CLASS);
        clickedURLElement.innerText = (action.document && action.document.title) || '';
        clickedURLElement.href = (action.document && action.document.clickUri) || '';
        titleSection.appendChild(clickedURLElement);

        document.createAttributeNS('svg', 'svg');

        li.appendChild(titleSection);
        li.appendChild(this.buildFooterElement(action));
        li.appendChild(this.buildIcon(duplicate));

        return li;
    }

    private buildViewEvent(action: UserAction): HTMLLIElement {
        const li = document.createElement('li');
        li.classList.add(EVENT_CLASS, VIEW_EVENT_CLASS);

        if (UserActivity.clickable_uri_ids.indexOf(action.raw.content_id_key) !== -1) {
            //If the content id key is included in the clickable_uri list, make the component a link
            const titleSection = document.createElement('div');
            titleSection.classList.add(ACTIVITY_TITLE_SECTION);

            const a = document.createElement('a');
            a.href = action.raw.content_id_value;
            a.innerText = action.raw.title || action.raw.content_id_value;
            titleSection.appendChild(a);
            li.appendChild(titleSection);
        } else {
            li.appendChild(this.buildTitleSection(action, action.raw.title || `${action.raw.content_id_key}: ${action.raw.content_id_value}`));
        }

        li.appendChild(this.buildFooterElement(action));
        li.appendChild(this.buildIcon(view));

        return li;
    }

    private buildCustomEvent(action: UserAction): HTMLLIElement {
        const li = document.createElement('li');
        li.classList.add(EVENT_CLASS, CUSTOM_EVENT_CLASS);

        li.appendChild(this.buildTitleSection(action, `${action.raw.event_value || action.raw.event_type || l(`${UserActivity.ID}_custom`)}`));
        li.appendChild(this.buildFooterElement(action));
        li.appendChild(this.buildIcon(dot));

        return li;
    }

    private buildTicketCreated(action: UserAction): HTMLLIElement {
        const li = document.createElement('li');
        li.classList.add(EVENT_CLASS, CUSTOM_EVENT_CLASS, CASE_CREATION_ACTION_CLASS);

        li.appendChild(this.buildTitleSection(action, 'Ticket Created'));
        li.appendChild(this.buildFooterElement(action));
        li.appendChild(this.buildIcon(flag));
        return li;
    }

    private buildFooterElement(action: UserAction): HTMLElement {
        const el = document.createElement('div');
        el.classList.add(ORIGIN_CLASS);
        el.innerText = `${formatTime(action.timestamp)}`;
        if (action.raw.origin_level_1) {
            el.innerText += ` - ${action.raw.origin_level_1}`;
        }
        return el;
    }

    private buildTitleElement(_: UserAction, content: string): HTMLElement {
        const el = document.createElement('div');
        el.classList.add(ACTIVITY_TITLE_CLASS);
        el.innerText = content;
        return el;
    }

    private buildTitleSection(action: UserAction, content: string): HTMLElement {
        const titleSection = document.createElement('div');
        titleSection.classList.add(ACTIVITY_TITLE_SECTION);
        titleSection.appendChild(this.buildTitleElement(action, content));
        return titleSection;
    }

    private buildIcon(icon: string): HTMLElement {
        const el = document.createElement('div');
        el.classList.add(ICON_CLASS);
        el.innerHTML = icon;
        return el;
    }
}

Initialization.registerAutoCreateComponent(UserActivity);
