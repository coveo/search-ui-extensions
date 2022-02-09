import { Component, IComponentBindings, Initialization, ComponentOptions, l, get } from 'coveo-search-ui';
import { formatTime, formatDate } from '../../utils/time';
import { UserAction, UserProfileModel, UserActionSession } from '../../models/UserProfileModel';
import { duplicate, search, view, dot, flag } from '../../utils/icons';
import { UserActionType } from '../../rest/UserProfilingEndpoint';
import './Strings';

const MSEC_IN_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;
const MAX_MINUTES_IN_SESSION = 30;
const MAX_MSEC_IN_SESSION = MAX_MINUTES_IN_SESSION * SECONDS_IN_MINUTE * MSEC_IN_SECOND;
const SESSION_BEFORE_TO_DISPLAY = 2;
const SESSION_AFTER_TO_DISPLAY = 2;

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

    /**
     * List of causes or event types to exclude from custom events being displayed.
     *
     * Default: `[ticket_create_start, ticket_field_update, ticket_next_stage, ticket_classification_click]`
     */
    customActionsExclude: string[];
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
        customActionsExclude: ComponentOptions.buildListOption({
            defaultValue: ['ticket_create_start', 'ticket_field_update', 'ticket_next_stage', 'ticket_classification_click'],
            required: true,
        }),
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
            const sortMostRecentFirst = (a: UserAction, b: UserAction) => b.timestamp.getTime() - a.timestamp.getTime();
            const sortedActions = [...actions].sort(sortMostRecentFirst);

            let filteredActions = sortedActions;
            if (this.options.customActionsExclude && this.options.customActionsExclude.length > 0) {
                filteredActions = sortedActions.filter((action) => this.filterActions(action));
            }
            this.sessions = this.splitActionsBySessions(filteredActions);

            this.buildSessionsToDisplay();

            this.render();
        });
    }

    public static parseDate(value: string | number): Date | null {
        try {
            return new Date(value);
        } catch (e) {
            console.warn(l(`${UserActivity.ID}_invalidDate`) + ` '${value}'`);
            return null;
        }
    }

    private filterActions(action: UserAction): boolean {
        return action.type !== UserActionType.Custom || !this.shouldExcludeCustomAction(action);
    }

    private shouldExcludeCustomAction(action: UserAction): boolean {
        const eventValue = action.raw.event_value || '';
        const eventType = action.raw.event_type || '';
        return this.options.customActionsExclude.includes(eventValue) || this.options.customActionsExclude.includes(eventType);
    }

    private isPartOfTheSameSession = (action: UserAction, previousDateTime: Date): boolean => {
        return Math.abs(action.timestamp.valueOf() - previousDateTime.valueOf()) < MAX_MSEC_IN_SESSION;
    };

    private splitActionsBySessions(actions: UserAction[]): UserActionSession[] {
        if (actions.length === 0) {
            return [];
        }
        const splitSessions: UserActionSession[] = [new UserActionSession(actions[0].timestamp, [])];
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
                const sessionIndexBefore = this.caseSubmitSessionIndex - SESSION_BEFORE_TO_DISPLAY;
                const sessionIndexAfter = this.caseSubmitSessionIndex + SESSION_AFTER_TO_DISPLAY;
                this.sessionsToDisplay = this.findSurroundingSessions(sessionIndexBefore, sessionIndexAfter);
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
        if (this.sessions.length > 0) {
            this.sessionsToDisplay = this.sessions.slice(0, 5);
            this.sessionsToDisplay[0].expanded = true;
        } else {
            this.sessionsToDisplay = [];
        }
    }

    private buildTicketCreatedAction(): UserAction {
        return new UserAction(UserActionType.TicketCreated, this.options.ticketCreationDateTime, {});
    }

    private findCaseSubmitSession(): { caseSubmitSessionIndex: number; caseSubmitSession: UserActionSession | null } {
        let caseSubmitSessionIndex = this.findSessionIncludingCaseSubmit();
        let caseSubmitSession = null;

        if (caseSubmitSessionIndex !== -1) {
            // If we found a session that correctly includes the timestamp when the ticket was created
            caseSubmitSession = this.sessions[caseSubmitSessionIndex];
            // return { caseSubmitSessionIndex: foundCaseSubmitSessionIndex, caseSubmitSession: this.sessions[foundCaseSubmitSessionIndex] };
        } else {
            // We can try to find a session that occurred just before the ticket create.
            caseSubmitSessionIndex = this.findPotentialSessionJustBeforeCaseSubmit();
            if (caseSubmitSessionIndex !== -1) {
                caseSubmitSession = this.sessions[caseSubmitSessionIndex];
            }
        }

        return {
            caseSubmitSessionIndex,
            caseSubmitSession,
        };
    }

    private findSessionIncludingCaseSubmit(): number {
        return this.sessions.findIndex(
            (session) =>
                session.actions[0].timestamp >= this.options.ticketCreationDateTime &&
                session.actions[session.actions.length - 1].timestamp <= this.options.ticketCreationDateTime
        );
    }

    private findPotentialSessionJustBeforeCaseSubmit(): number {
        const potentialSessionIndex = this.sessions.findIndex((session) => session.actions[0].timestamp <= this.options.ticketCreationDateTime);

        if (potentialSessionIndex !== -1) {
            const lastActionInSession = this.sessions[potentialSessionIndex].actions[0];

            if (!this.isPartOfTheSameSession(lastActionInSession, this.options.ticketCreationDateTime)) {
                // If the session before the ticket create is not part of the same session, create a standalone session.
                this.sessions.splice(potentialSessionIndex, 0, new UserActionSession(this.options.ticketCreationDateTime, []));
            }
            return potentialSessionIndex;
        }
        return -1;
    }

    private findSurroundingSessions(from: number, to: number): UserActionSession[] {
        // +1 because with slice `end` is not included.
        return this.sessions.slice(Math.max(0, from), Math.min(this.sessions.length, to + 1));
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
        if (this.sessionsToDisplay.length > 0) {
            const list = document.createElement('ol');

            const sessionsBuilt = this.buildSessionsItems(this.sessionsToDisplay);

            sessionsBuilt.forEach((sessionItem) => {
                if (sessionItem) {
                    list.appendChild(sessionItem);
                }
            });

            return list;
        } else {
            return this.buildNoActionsMessage();
        }
    }

    private buildNoActionsMessage(): HTMLElement {
        const noActionsDiv = document.createElement('div');
        noActionsDiv.innerHTML = `
        <p>${l(UserActivity.ID + '_no_actions_timeline')}.</p>
        <div>
            <span>${l('UserActions_no_actions_causes_title')}</span>
            <ul class="coveo-no-actions-causes">
                <li>${l('UserActions_no_actions_cause_not_associated')}.</li>
                <li>${l(UserActivity.ID + '_no_actions_cause_filtered')}.</li>
            </ul>
        </div>
        <p>${l('UserActions_no_actions_contact_admin')}.</p>`;
        return noActionsDiv;
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
                    htmlElements.push(this.buildFoldedSession(session, l(`${UserActivity.ID}_showNewSession`)));
                }
                if (hitExpanded && sessions[index - 1]?.expanded) {
                    htmlElements.push(this.buildFoldedSession(session, l(`${UserActivity.ID}_showPastSession`)));
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
        span.innerText = showMoreButtonText || l(`${UserActivity.ID}_showMore`);

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
        sessionHeader.innerText = l(`${UserActivity.ID}_session`) + ` ${formatDate(session.timestamp)}`;

        return sessionHeader;
    }

    private buildSessionContent(actions: UserAction[], withFolded: boolean): HTMLLIElement[] {
        let actionsHTML = [];
        let actionsToDisplay = actions;
        if (withFolded && this.options.ticketCreationDateTime && !this.hasExpandedActions) {
            // Special behavior because, in the session with the Ticket Creation event,
            // until the user expands them, the actions that occurred AFTER a ticket creation are collapsed.
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
        span.innerText = l(`${UserActivity.ID}_showMoreActions`);

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
        try {
            const defaultBuilder = (action: UserAction) => this.buildCustomEvent(action);
            const buildersMap = {
                [UserActionType.Click]: (action: UserAction) => this.buildClickEvent(action),
                [UserActionType.Search]: (action: UserAction) => this.buildSearchEvent(action),
                [UserActionType.PageView]: (action: UserAction) => this.buildViewEvent(action),
                [UserActionType.TicketCreated]: (action: UserAction) => this.buildTicketCreated(action),
                [UserActionType.Custom]: (action: UserAction) => this.buildCustomEvent(action),
            };

            const builder = buildersMap[action.type] || defaultBuilder;

            return builder(action);
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    private buildSearchEvent(action: UserAction): HTMLLIElement {
        const li = document.createElement('li');
        li.classList.add(EVENT_CLASS, SEARCH_EVENT_CLASS);

        li.appendChild(this.buildTitleSection(action, action.query || l(`${UserActivity.ID}_emptySearch`)));
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

        li.appendChild(this.buildTitleSection(action, l(`${UserActivity.ID}_ticketCreated`)));
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
