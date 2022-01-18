import { Component, IComponentBindings, Initialization, ComponentOptions, l, get } from 'coveo-search-ui';
// import { formatTime, formatDate, formatTimeInterval } from '../../utils/time';
import { UserAction, UserProfileModel, UserActionSession } from '../../models/UserProfileModel';
import { duplicate, search, view, dot } from '../../utils/icons';
import { UserActionType } from '../../rest/UserProfilingEndpoint';
// import { MANUAL_SEARCH_EVENT_CAUSE } from '../../utils/events';
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
     * List of event cause to unfold.
     * This option override the **unfoldExclude** option.
     *
     * Default: `['didyoumeanAutomatic','didyoumeanClick','omniboxAnalytics','omniboxFromLink','searchboxSubmit','searchFromLink','userActionsSubmit']`
     */
    unfoldInclude: string[];

    /**
     * List of event cause to fold.
     * This option is override by the **unfoldInclude** option.
     *
     * Default: `[]`
     */
    unfoldExclude: string[];

    /**
     * Hide all custom events from the User Activity timeline.
     *
     * Default: true
     */
    hideCustomEvents: boolean;
}

const MAIN_CLASS = 'coveo-user-activity';
// const CELL_CLASS = 'coveo-cell';
// const TITLE_CLASS = 'coveo-title';
// const DATA_CLASS = 'coveo-data';
const ORIGIN_CLASS = 'coveo-footer';
const ACTIVITY_TITLE_SECTION = 'coveo-activity-title-section';
const ACTIVITY_TITLE_CLASS = 'coveo-activity-title';
// const ACTIVIY_TIMESTAMP_CLASS = 'coveo-activity-timestamp';
// const HEADER_CLASS = 'coveo-header';
const ACTIVITY_CLASS = 'coveo-activity';
const CLICK_EVENT_CLASS = 'coveo-click';
const SEARCH_EVENT_CLASS = 'coveo-search';
const CUSTOM_EVENT_CLASS = 'coveo-custom';
const VIEW_EVENT_CLASS = 'coveo-view';
const FOLDED_CLASS = 'coveo-folded';
const FOLDED_ACTIONS_CLASS = 'coveo-folded-actions';
const TEXT_CLASS = 'coveo-text';
const ICON_CLASS = 'coveo-icon';
const CASE_CREATION_ACTION_CLASS = 'coveo-case-creation-action'
// const BUBBLE_CLASS = 'coveo-bubble';
// const WIDTH_CUTOFF = 350;

export class UserActivity extends Component {
    static readonly ID = 'UserActivity';
    static readonly options: IUserActivityOptions = {
        userId: ComponentOptions.buildStringOption({ required: true }),
        unfoldInclude: ComponentOptions.buildListOption({
            defaultValue: [
                'didyoumeanAutomatic',
                'didyoumeanClick',
                'omniboxAnalytics',
                'omniboxFromLink',
                'searchboxSubmit',
                'searchFromLink',
                'userActionsSubmit',
            ],
            required: true,
        }),
        unfoldExclude: ComponentOptions.buildListOption({
            defaultValue: [],
            required: true,
        }),
        hideCustomEvents: ComponentOptions.buildBooleanOption({
            defaultValue: true,
            required: false,
        }),
    };

    private static clickable_uri_ids = ['@clickableuri'];
    private sessions: UserActionSession[];
    private sessionsToDisplay: UserActionSession[];
    private caseSubmitSessionIndex: number;
    private caseSubmitActionIndex: number;
    private foldedActions: UserAction[] = [];
    private userProfileModel: UserProfileModel;

    private foldedSessions: UserActionSession[];

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

        if (!this.options.userId) {
            this.disable();
            return;
        }

        this.userProfileModel = get(this.root, UserProfileModel) as UserProfileModel;

        this.userProfileModel.getActions(this.options.userId).then((actions) => {
            const sortedActions = actions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            this.sessions = this.splitActionsBySessions(sortedActions);
            console.log(this.sessions);

            this.buildSessionsToDisplay();

            this.render();
        });
    }

    private isPartOfTheSameSession = (action: UserAction, previousDateTime: Date): boolean => {
        return (
            Math.abs(action.timestamp.valueOf() - previousDateTime.valueOf()) / DATE_TO_SECONDS / DATE_TO_MINUTES < MAX_MINUTES_IN_SESSION &&
            action.timestamp.getDate() - previousDateTime.getDate() == 0
        );
    };

    private splitActionsBySessions(actions: UserAction[]): UserActionSession[] {
        if (actions.length === 0) {
            return [];
        }
        let splitSessions: UserActionSession[] = [];
        splitSessions.push({
            timestamp: actions[0].timestamp,
            actions: [],
        });
        let previousDateTime = actions[0]?.timestamp;
        let currentSession: UserActionSession = splitSessions[0];
        actions.forEach((action) => {
            if (this.isPartOfTheSameSession(action, previousDateTime)) {
                currentSession.actions.push(action);
            } else {
                splitSessions.push({
                    timestamp: action.timestamp,
                    actions: [action],
                });
                currentSession = splitSessions[splitSessions.length - 1];
            }
            previousDateTime = action.timestamp;
        });
        return splitSessions;
    }

    private buildSessionsToDisplay() {
        this.caseSubmitSessionIndex = this.findCaseSubmitSessionIndex();
        if (this.caseSubmitSessionIndex !== -1) {
            console.log('Found Case Creation');
            // Testing usecase
            this.sessions[this.caseSubmitSessionIndex].actions.unshift(...this.sessions[0].actions);
            this.sessions[this.caseSubmitSessionIndex].actions.push(...this.sessions[0].actions);

            this.sessionsToDisplay = this.findSurroundingSessions();

            this.caseSubmitActionIndex = this.findCaseSubmitActionIndex(this.sessions[this.caseSubmitSessionIndex]?.actions);

            this.foldedSessions = this.sessionsToDisplay.filter(session => session !== this.sessions[this.caseSubmitSessionIndex]);
            this.foldedActions = this.sessions[this.caseSubmitSessionIndex]?.actions.filter((_, index) => index < this.caseSubmitActionIndex);
            if(this.options.hideCustomEvents) {
                this.foldedActions = this.foldedActions.filter(action => action.type !== UserActionType.Custom);
            }
            console.log(this.caseSubmitActionIndex);

        } else {
            console.log('Didn\'t find Case Creation');
            this.sessionsToDisplay = this.sessions.slice(0, 5);
            this.foldedSessions = this.sessions.slice(1, 5);
        }
    }

    private findCaseSubmitSessionIndex(): number {

        return this.sessions.findIndex(
            session => session.actions.some(
                action => this.isCaseSubmitAction(action)
            )
        );
    }

    private findCaseSubmitActionIndex(actions: UserAction[]): number {
        let caseSubmitActionIndex = -1;
        if (actions && Array.isArray(actions)) {
            caseSubmitActionIndex = actions.findIndex(action => this.isCaseSubmitAction(action));
        }
        return caseSubmitActionIndex;
    }

    private isCaseSubmitAction(action: UserAction): boolean {
        return action.type === UserActionType.Custom
            && (action.raw.event_type === 'ticket_create' || action.raw.cause === 'CaseSubmit');
    }

    private findSurroundingSessions(): UserActionSession[] {
        return this.sessions.slice(
            Math.max(0, this.caseSubmitSessionIndex - 2),
            Math.min(this.caseSubmitSessionIndex + 3, this.sessions.length)
        );
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
        const nbUnfoldedSessions = this.sessionsToDisplay.length - this.foldedSessions.length;

        let hitExpanded = false;
        let sessionsFiltered = sessions;
        
        return sessionsFiltered
            .reduce((acc, session) => {
                const last = acc[acc.length - 1];
                const shouldBeFolded = this.foldedSessions.indexOf(session) !== -1;
                if (shouldBeFolded && nbUnfoldedSessions > 0) {
                    if (Array.isArray(last)) {
                        last.push(session);
                        return [...acc];
                    } else {
                        return [...acc, [session]];
                    }
                } else {
                    return [...acc, session];
                }
            }, [])
            .map((item: UserActionSession) => {
                if (Array.isArray(item)) {
                    return this.buildFoldedSession(
                        hitExpanded ? item[0] : item[item.length - 1],
                        hitExpanded ? 'Show past session' : 'Show new session'
                    );
                }
                hitExpanded = true;
                const isCaseSubmitSession = this.caseSubmitSessionIndex !== -1 && item === this.sessions[this.caseSubmitSessionIndex];
                if(this.options.hideCustomEvents) {
                    item.actions = item.actions.filter(action => action.type !== UserActionType.Custom ||
                    (
                        this.isCaseSubmitAction(action) 
                        && isCaseSubmitSession
                    ))
                }
                return this.buildSessionItem(item, isCaseSubmitSession);
            });
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
            this.foldedSessions = this.foldedSessions.filter((session) => session !== sessionToExpand);
            this.render();
        });

        li.appendChild(hr);

        return li;
    }

    private buildSessionItem(session: UserActionSession, isCaseSubmitSession: boolean): HTMLElement {
        if (session.actions.length === 0) {
            return null;
        }

        const sessionContainer = document.createElement('div');
        sessionContainer.classList.add('coveo-session-container');
        sessionContainer.appendChild(this.buildSessionHeader(session));

        const foldedActions = (isCaseSubmitSession) ? this.foldedActions : [];
        this.buildSessionContent(session.actions, foldedActions).forEach((actionHTML) => sessionContainer.appendChild(actionHTML));
        return sessionContainer;
    }

    private buildSessionHeader(session: UserActionSession): HTMLElement {
        const sessionHeader = document.createElement('div');
        sessionHeader.classList.add('coveo-session-header');
        sessionHeader.innerText = `Session ${session.timestamp.toLocaleDateString()}`;
        return sessionHeader;
    }

    private buildSessionContent(actions: UserAction[], foldedActions: UserAction[]): HTMLLIElement[] {
        const nbUnfoldedActions = actions.length - foldedActions.length;

        return actions.reduce((acc, action, index) => {
            const last = acc[acc.length - 1];
            const shouldBeFolded = index < nbUnfoldedActions;
            if (shouldBeFolded && foldedActions.length > 0) {
                    if (Array.isArray(last)) {
                        last.push(action);
                        return [...acc];
                    } else {
                        return [...acc, [action]];
                    }
                } else {
                    return [...acc, action];
                }
        }, [])
        .map(item => {
            if(Array.isArray(item)) {
                return this.buildFoldedActions();
            }
            return this.buildActionListItem(item);
        })

        return actions.map((action, index) => {
            if (index < nbUnfoldedActions) {
                return this.buildFoldedActions();
            }
            return this.buildActionListItem(action);
        });
    }

    private buildFoldedActions(): HTMLLIElement {
        const li = document.createElement('li');
        li.classList.add(FOLDED_ACTIONS_CLASS);

        const hr = document.createElement('hr');
        const span = document.createElement('span');
        span.classList.add(TEXT_CLASS);
        span.innerText = 'More actions...';

        hr.appendChild(span);

        li.addEventListener('click', () => {
            this.foldedActions = [];
            this.render();
        });

        li.appendChild(hr);
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
            default:
            case UserActionType.Custom:
                li = this.buildCustomEvent(action, this.isCaseSubmitAction(action));
                break;
        }
        return li;
    }

    private buildSearchEvent(action: UserAction): HTMLLIElement {
        const li = document.createElement('li');
        li.classList.add(SEARCH_EVENT_CLASS);

        li.appendChild(this.buildTitleSection(action, action.query || 'Empty Search'));
        li.appendChild(this.buildFooterElement(action));
        li.appendChild(this.buildIcon(search));
        if (action.raw.origin_level_1) {
            // li.appendChild(this.buildTooltipElement(action));
        }

        return li;
    }

    private buildClickEvent(action: UserAction): HTMLLIElement {
        const li = document.createElement('li');
        li.classList.add(CLICK_EVENT_CLASS);

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
        li.classList.add(VIEW_EVENT_CLASS);

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

    private buildCustomEvent(action: UserAction, shouldBeBolded: boolean): HTMLLIElement {
        const li = document.createElement('li');
        li.classList.add(CUSTOM_EVENT_CLASS, CASE_CREATION_ACTION_CLASS);

        li.appendChild(this.buildTitleSection(action, `${action.raw.event_value || action.raw.event_type || l(`${UserActivity.ID}_custom`)}`));
        li.appendChild(this.buildFooterElement(action));
        li.appendChild(this.buildIcon(dot));

        return li;
    }

    // private buildTooltipElement(action: UserAction): HTMLElement {
    //     const caption = document.createElement('div');
    //     caption.classList.add('coveo-caption-for-icon');
    //     caption.innerText = action.raw.origin_level_1;

    //     const arrow = document.createElement('div');
    //     arrow.classList.add('coveo-arrow-for-tooltip');
    //     caption.appendChild(arrow);

    //     return caption;
    // }

    private buildFooterElement(action: UserAction): HTMLElement {
        const el = document.createElement('div');
        el.classList.add(ORIGIN_CLASS);
        el.innerText = `${action.timestamp.toLocaleTimeString()}`;
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

    private buildIcon(icon: string) {
        const el = document.createElement('div');
        el.classList.add(ICON_CLASS);
        el.innerHTML = icon;
        return el;
    }
}

Initialization.registerAutoCreateComponent(UserActivity);
