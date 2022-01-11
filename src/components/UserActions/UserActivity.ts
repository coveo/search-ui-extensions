import { Component, IComponentBindings, Initialization, ComponentOptions, l, get } from 'coveo-search-ui';
import { formatTime, formatDate, formatDateAndTime, formatDateAndTimeShort, formatTimeInterval } from '../../utils/time';
import { UserAction, UserProfileModel } from '../../models/UserProfileModel';
import { duplicate, search, view, dot } from '../../utils/icons';
import { UserActionType } from '../../rest/UserProfilingEndpoint';
import { MANUAL_SEARCH_EVENT_CAUSE } from '../../utils/events';
import './Strings';

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
}

const MAIN_CLASS = 'coveo-user-activity';
const CELL_CLASS = 'coveo-cell';
const TITLE_CLASS = 'coveo-title';
const DATA_CLASS = 'coveo-data';
const ORIGIN_CLASS = 'coveo-footer';
const ACTIVITY_TITLE_SECTION = 'coveo-activity-title-section';
const ACTIVITY_TITLE_CLASS = 'coveo-activity-title';
const ACTIVIY_TIMESTAMP_CLASS = 'coveo-activity-timestamp';
const HEADER_CLASS = 'coveo-header';
const ACTIVITY_CLASS = 'coveo-activity';

const CLICK_EVENT_CLASS = 'coveo-click';
const SEARCH_EVENT_CLASS = 'coveo-search';
const CUSTOM_EVENT_CLASS = 'coveo-custom';
const VIEW_EVENT_CLASS = 'coveo-view';
const FOLDED_CLASS = 'coveo-folded';
const TEXT_CLASS = 'coveo-text';
const ICON_CLASS = 'coveo-icon';
const BUBBLE_CLASS = 'coveo-bubble';

const WIDTH_CUTOFF = 350;

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
    };

    private static clickable_uri_ids = ['@clickableuri'];
    private actions: UserAction[];
    private foldedActions: UserAction[];
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

        if (!this.options.userId) {
            this.disable();
            return;
        }

        this.userProfileModel = get(this.root, UserProfileModel) as UserProfileModel;

        this.userProfileModel.getActions(this.options.userId).then((actions) => {
            this.actions = actions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            this.foldedActions = this.actions.filter((action) => !this.isUnfoldByDefault(action));
            this.render();
        });
    }

    private isUnfoldByDefault(action: UserAction) {
        const isCustom = action.type === UserActionType.Custom;
        const isSearch = action.type === UserActionType.Search;
        const isClick = action.type === UserActionType.Click;

        const cause = (isCustom && action.raw.event_value) || (isSearch && action.raw.cause) || '';

        const useInclude = this.options.unfoldInclude && this.options.unfoldInclude.length > 0;

        const isExcluded = (isSearch || isCustom) && this.options.unfoldExclude.indexOf(cause) !== -1;
        const isIncluded = (isSearch || isCustom) && this.options.unfoldInclude.indexOf(cause) !== -1;

        return isClick || (useInclude && isIncluded) || (!useInclude && !isExcluded);
    }

    private render() {
        const panel = document.createElement('div');
        panel.classList.add(MAIN_CLASS);

        const timestampSection = document.createElement('div');
        timestampSection.classList.add(HEADER_CLASS);

        this.buildTimestampSection().forEach((el) => timestampSection.appendChild(el));

        const activitySection = this.buildActivitySection();
        activitySection.classList.add(ACTIVITY_CLASS);

        panel.appendChild(timestampSection);
        panel.appendChild(activitySection);

        this.element.innerHTML = '';
        this.element.appendChild(panel);
    }

    private buildActivitySection(): HTMLElement {
        const list = document.createElement('ol');

        this.buildListItems(this.actions).forEach((listItem, index, array) => {
            list.appendChild(listItem);
            if (index < array.length - 1) {
                list.appendChild(this.buildBubble());
            }
        });

        return list;
    }

    private buildBubble() {
        const li = document.createElement('li');
        li.classList.add(BUBBLE_CLASS);
        return li;
    }

    private buildListItems(actions: UserAction[]): HTMLElement[] {
        const nbUnfoldedActions = this.actions.length - this.foldedActions.length;

        return actions
            .reduce((acc, action) => {
                const last = acc[acc.length - 1];
                if (this.foldedActions.indexOf(action) !== -1 && nbUnfoldedActions > 0) {
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
            .map((item) => {
                if (Array.isArray(item)) {
                    return this.buildFolded(item);
                } else {
                    return this.buildListItem(item);
                }
            });
    }

    private buildListItem(action: UserAction): HTMLLIElement {
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
                li = this.buildCustomEvent(action);
                break;
        }
        return li;
    }

    private buildFolded(actions: UserAction[]): HTMLLIElement {
        const li = document.createElement('li');
        li.classList.add(FOLDED_CLASS);

        const hr = document.createElement('hr');

        const span = document.createElement('span');
        span.classList.add(TEXT_CLASS);
        span.innerText = `${actions.length} ${actions.length > 1 ? l(`${UserActivity.ID}_other_events`) : l(`${UserActivity.ID}_other_event`)}`;

        hr.appendChild(span);

        li.addEventListener('click', () => {
            this.foldedActions = this.foldedActions.filter((action) => actions.indexOf(action) === -1);
            this.render();
        });

        li.appendChild(hr);

        return li;
    }

    private buildClickEvent(action: UserAction): HTMLLIElement {
        const li = document.createElement('li');
        li.classList.add(CLICK_EVENT_CLASS);

        const dataElement = document.createElement('a');
        dataElement.classList.add(DATA_CLASS);
        dataElement.innerText = (action.document && action.document.title) || '';
        dataElement.href = (action.document && action.document.clickUri) || '';

        document.createAttributeNS('svg', 'svg');

        li.appendChild(this.buildTitleSection(action));
        if (action.document) {
            li.appendChild(dataElement);
        }
        li.appendChild(this.buildOriginElement(action));
        li.appendChild(this.buildIcon(duplicate));

        return li;
    }

    private buildSearchEvent(action: UserAction): HTMLLIElement {
        const li = document.createElement('li');
        li.classList.add(SEARCH_EVENT_CLASS);

        li.appendChild(this.buildTitleSection(action));

        if (action.query) {
            const dataElement = document.createElement('div');
            dataElement.classList.add(DATA_CLASS);
            dataElement.innerText = action.query || '';

            li.appendChild(dataElement);
        }

        li.appendChild(this.buildOriginElement(action));
        li.appendChild(this.buildIcon(search));

        return li;
    }

    private buildViewEvent(action: UserAction): HTMLLIElement {
        const li = document.createElement('li');
        li.classList.add(VIEW_EVENT_CLASS);

        const dataElement = document.createElement('div');
        if (UserActivity.clickable_uri_ids.indexOf(action.raw.content_id_key) !== -1) {
            //If the content id key is included in the clickable_uri list, make the component a link
            const a = document.createElement('a');
            a.href = action.raw.content_id_value;
            a.innerText = action.raw.content_id_value;
            dataElement.appendChild(a);
        } else {
            dataElement.innerText = `${action.raw.content_id_key}: ${action.raw.content_id_value}`;
        }

        dataElement.classList.add(DATA_CLASS);

        li.appendChild(this.buildTitleSection(action));
        li.appendChild(dataElement);
        li.appendChild(this.buildOriginElement(action));
        li.appendChild(this.buildIcon(view));

        return li;
    }

    private buildCustomEvent(action: UserAction): HTMLLIElement {
        const li = document.createElement('li');
        li.classList.add(CUSTOM_EVENT_CLASS);

        const titleElem = document.createElement('div');
        titleElem.classList.add(ACTIVITY_TITLE_CLASS);
        titleElem.innerText = `${l(action.raw.event_type || `${UserActivity.ID}_custom`)}`;

        const titleSection = this.buildTitleSection(action);
        titleSection.querySelector(`.${ACTIVITY_TITLE_CLASS}`).remove();
        titleSection.insertBefore(titleElem, titleSection.firstChild);

        const dataElement = document.createElement('div');
        dataElement.classList.add(DATA_CLASS);
        dataElement.innerText = action.raw.event_value || '';

        li.appendChild(titleSection);
        li.appendChild(dataElement);
        li.appendChild(this.buildOriginElement(action));
        li.appendChild(this.buildIcon(dot));

        return li;
    }

    private buildOriginElement(action: UserAction): HTMLElement {
        const el = document.createElement('div');
        el.classList.add(ORIGIN_CLASS);
        el.innerText = action.raw.origin_level_1 || '';
        return el;
    }

    private buildTimestampElement(action: UserAction): HTMLElement {
        const el = document.createElement('div');
        el.classList.add(ACTIVIY_TIMESTAMP_CLASS);
        el.innerText = this.element.offsetWidth > WIDTH_CUTOFF ? formatDateAndTime(action.timestamp) : formatDateAndTimeShort(action.timestamp);
        return el;
    }

    private buildTitleElement(action: UserAction): HTMLElement {
        const title = this.isManualSubmitAction(action) ? 'query' : action.type.toLowerCase();

        const el = document.createElement('div');
        el.classList.add(ACTIVITY_TITLE_CLASS);
        el.innerText = l(`${UserActivity.ID}_${title}`);
        return el;
    }

    private buildTitleSection(action: UserAction): HTMLElement {
        const titleSection = document.createElement('div');
        titleSection.classList.add(ACTIVITY_TITLE_SECTION);
        titleSection.appendChild(this.buildTitleElement(action));
        titleSection.appendChild(this.buildTimestampElement(action));
        return titleSection;
    }

    private buildIcon(icon: string) {
        const el = document.createElement('div');
        el.classList.add(ICON_CLASS);
        el.innerHTML = icon;
        return el;
    }

    private buildTimestampSection(): HTMLElement[] {
        const startDate = this.actions[0];
        const endDate = this.actions[this.actions.length - 1];
        const duration = endDate.timestamp.getTime() - startDate.timestamp.getTime();

        return [
            this.buildTimestampCell({ title: l(`${UserActivity.ID}_start_date`), data: formatDate(startDate.timestamp) }),
            this.buildTimestampCell({ title: l(`${UserActivity.ID}_start_time`), data: formatTime(startDate.timestamp) }),
            this.buildTimestampCell({ title: l(`${UserActivity.ID}_duration`), data: formatTimeInterval(duration) }),
        ];
    }

    private buildTimestampCell({ title, data }: { title: string; data: string }): HTMLElement {
        const cell = document.createElement('div');
        cell.classList.add(CELL_CLASS);

        const titleElement = document.createElement('div');
        titleElement.classList.add(TITLE_CLASS);
        titleElement.innerText = title;

        const dataElement = document.createElement('div');
        dataElement.classList.add(DATA_CLASS);
        dataElement.innerText = data;

        cell.appendChild(titleElement);
        cell.appendChild(dataElement);

        return cell;
    }

    /**
     * Dertermine if an action is a manual search submit.
     * A manual search submit is a Search event that has a query expression and that the cause is one of the above:
     * + **omniboxAnalytics**
     * + **userActionsSubmit**
     * + **omniboxFromLink**
     * + **searchboxAsYouType**
     * + **searchboxSubmit**
     * + **searchFromLink**
     * @param action Action that will be tested.
     */
    private isManualSubmitAction(action: UserAction) {
        return action.type === UserActionType.Search && action.raw.query_expression && MANUAL_SEARCH_EVENT_CAUSE.indexOf(action.raw.cause) !== -1;
    }
}

Initialization.registerAutoCreateComponent(UserActivity);
