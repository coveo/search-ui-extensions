import {
    Component,
    IComponentBindings,
    Initialization,
    ComponentOptions,
    QueryEvents,
    l,
    get,
    ResultListEvents,
    IDisplayedNewResultEventArgs,
    ResultList,
} from 'coveo-search-ui';
import { ResponsiveUserActions } from './ResponsiveUserActions';
import { arrowDown } from '../../utils/icons';
import { ClickedDocumentList } from './ClickedDocumentList';
import { QueryList } from './QueryList';
import { UserActivity } from './UserActivity';
import { UserProfileModel } from '../../Index';
import './Strings';
import { ViewedByCustomer } from '../ViewedByCustomer/ViewedByCustomer';
import { UserActionEvents } from './Events';

enum ResultLayoutType {
    LIST = 'list',
    TABLE = 'table',
    CARD = 'card',
}

/**
 * Initialization options of the **UserActions** class.
 */
export interface IUserActionsOptions {
    /**
     * Identifier of the user from which Clicked Documents are shown.
     *
     * **Require**
     */
    userId: string;

    /**
     * Label of the button used to open the user actions.
     *
     * Default: `User Actions`
     */
    buttonLabel: string;

    /**
     * Label of the summary section.
     *
     * Default: `Session Summary`
     */
    summaryLabel: string;

    /**
     * Label of the activity section.
     *
     * Default: `User Activity Timeline`
     */
    activityLabel: string;

    /**
     * Whether or not to add the ViewedByCustomer component
     *
     * Default: `True`
     */
    viewedByCustomer: Boolean;
    /**
     * Whether or not the UserAction component should be displayed
     * Can be used to use ViewedByCustomer alone.
     *
     * Default: `False`
     */
    hidden: Boolean;
    /**
     * Whether or not the UserAction component should use the CoveoSearchUI ResponsiveManager
     * Inoperant if `hidden` is true.
     *
     * Default: `True`
     */
    useResponsiveManager: Boolean;
}

/**
 * Display a panel that contains a summary of a user session and that also contains detailed information about user actions.
 */
export class UserActions extends Component {
    /**
     * Identifier of the Search-UI component.
     */
    static readonly ID = 'UserActions';
    static readonly Events = {
        Hide: 'userActionsPanelHide',
        Show: 'userActionsPanelShow',
    };

    /**
     * Default initialization options of the **UserActions** class.
     */
    static readonly options: IUserActionsOptions = {
        userId: ComponentOptions.buildStringOption({ required: true }),
        buttonLabel: ComponentOptions.buildStringOption({
            defaultValue: 'User Actions',
        }),
        summaryLabel: ComponentOptions.buildStringOption({
            defaultValue: 'Session Summary',
        }),
        activityLabel: ComponentOptions.buildStringOption({
            defaultValue: 'User Activity Timeline',
        }),
        viewedByCustomer: ComponentOptions.buildBooleanOption({
            defaultValue: true,
        }),
        hidden: ComponentOptions.buildBooleanOption({
            defaultValue: false,
        }),
        useResponsiveManager: ComponentOptions.buildBooleanOption({
            defaultValue: true,
        }),
    };

    private static readonly USER_ACTION_OPENED = 'coveo-user-actions-opened';
    private isOpened: boolean;

    /**
     * Create an instance of the **UserActions** class. Initialize is needed the **UserProfileModel** and fetch user actions related to the **UserId**.
     *
     * @param element Element on which to bind the component.
     * @param options Initialization options of the component.
     * @param bindings Bindings of the Search-UI environment.
     */
    constructor(public element: HTMLElement, public options: IUserActionsOptions, public bindings: IComponentBindings) {
        super(element, UserActions.ID, bindings);

        this.options = ComponentOptions.initComponentOptions(element, UserActions, options);

        if (!this.options.userId) {
            this.disable();
            return;
        }

        if (this.options.viewedByCustomer) {
            this.showViewedByCustomer();
        }

        this.tagViewsOfUser();

        if (!options.hidden) {
            if (options.useResponsiveManager) {
                ResponsiveUserActions.init(this.root, this);
            }
            this.bind.onRootElement(QueryEvents.newQuery, () => this.hide());
            this.hide();
        }
    }

    /**
     * Collapse the panel.
     */
    public hide() {
        if (this.isOpened) {
            this.isOpened = false;
            (get(this.root, UserProfileModel) as UserProfileModel).deleteActions(this.options.userId);
            this.root.classList.remove(UserActions.USER_ACTION_OPENED);
            this.element.dispatchEvent(new CustomEvent(UserActions.Events.Hide));
        }
    }

    /**
     * Open the panel.
     */
    public async show() {
        if (!this.isOpened) {
            this.isOpened = true;
            this.renderLoading();
            this.element.dispatchEvent(new CustomEvent(UserActions.Events.Show));
            this.bindings.usageAnalytics.logCustomEvent(UserActionEvents.open, {}, this.element);
            this.root.classList.add(UserActions.USER_ACTION_OPENED);
            try {
                const userActions = await (get(this.root, UserProfileModel) as UserProfileModel).getActions(this.options.userId);
                if (userActions.length > 0) {
                    this.render();
                } else {
                    this.renderNoActions();
                }
            } catch (e) {
                if (e?.statusCode === 404) {
                    this.renderEnablePrompt();
                } else {
                    this.renderNoActions();
                }
            }
        }
    }

    /**
     * Toggle the visibility of the panel.
     */
    public async toggle() {
        if (this.isOpened) {
            this.hide();
        } else {
            await this.show();
        }
    }

    private buildAccordionHeader(title: string) {
        const div = document.createElement('div');
        div.classList.add('coveo-accordion-header');

        const headerTitle = document.createElement('div');
        headerTitle.classList.add('coveo-accordion-header-title');
        headerTitle.innerText = title;

        const arrow = document.createElement('div');
        arrow.classList.add('coveo-arrow-down');
        arrow.innerHTML = arrowDown;

        div.appendChild(headerTitle);
        div.appendChild(arrow);

        return div;
    }

    private buildAccordion(title: string, elements: HTMLElement[]) {
        const div = document.createElement('div');
        div.classList.add('coveo-accordion');

        const header = this.buildAccordionHeader(title);

        const foldable = document.createElement('div');
        foldable.classList.add('coveo-accordion-foldable');

        elements.forEach((el) => foldable.appendChild(el));

        div.appendChild(header);
        div.appendChild(foldable);

        header.addEventListener('click', () => {
            if (div.classList.contains('coveo-folded')) {
                div.classList.remove('coveo-folded');
            } else {
                div.classList.add('coveo-folded');
            }
        });

        return div;
    }

    private buildCoveoElement(klass: any) {
        const el = document.createElement('div');
        el.classList.add(`Coveo${klass.ID}`);
        return el;
    }

    /**
     * Initialize child Search-UI component and pass down critical options.
     *
     * @param element Parent element of each child that would be initialize.
     */
    private initializeSearchUIComponents(element: HTMLElement) {
        const originalOptions = this.searchInterface.options.originalOptionsObject;

        Initialization.automaticallyCreateComponentsInside(element, {
            options: {
                ...originalOptions,
                QueryList: {
                    ...originalOptions.QueryList,
                    userId: this.options.userId,
                },
                ClickedDocumentList: {
                    ...originalOptions.ClickedDocumentList,
                    userId: this.options.userId,
                },
                UserActivity: {
                    ...originalOptions.UserActivity,
                    userId: this.options.userId,
                },
            },
            bindings: this.bindings,
        });
    }

    private renderLoading() {
        this.element.innerHTML = '';
        const loadingElement = document.createElement('div');
        loadingElement.classList.add('coveo-loading-container');
        loadingElement.innerHTML = `
        <div role="status" class="slds-spinner slds-spinner--medium">
            <span class="slds-assistive-text">Loading</span>
            <div class="slds-spinner__dot-a"></div>
            <div class="slds-spinner__dot-b"></div>
        </div>`;
        this.element.appendChild(loadingElement);
    }

    private render() {
        const element = document.createElement('div');

        const summarySection = this.buildAccordion(this.options.summaryLabel, [
            this.buildCoveoElement(ClickedDocumentList),
            this.buildCoveoElement(QueryList),
        ]);
        summarySection.classList.add(`coveo-summary`);

        const detailsSection = this.buildAccordion(this.options.activityLabel, [this.buildCoveoElement(UserActivity)]);
        detailsSection.classList.add('coveo-details');

        element.appendChild(summarySection);
        element.appendChild(detailsSection);

        this.initializeSearchUIComponents(element);

        this.element.innerHTML = '';
        this.element.appendChild(element);
    }

    private renderNoActions() {
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('coveo-no-actions');
        messageContainer.innerHTML = `
        <div class="coveo-user-actions-title">${l(UserActions.ID)}</div>
        <p>${l(UserActions.ID + '_no_actions_title')}.</p>
        <div>
            <span>${l(UserActions.ID + '_no_actions_causes_title')}</span>
            <ul class="coveo-no-actions-causes">
                <li>${l(UserActions.ID + '_no_actions_cause_not_associated')}.</li>
                <li>${l(UserActions.ID + '_no_actions_cause_case_too_old')}.</li>
            </ul>
        </div>
        <p>${l(UserActions.ID + '_no_actions_contact_admin')}.</p>
        `;

        this.element.innerHTML = '';
        this.element.appendChild(messageContainer);
    }

    private renderEnablePrompt() {
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('coveo-no-actions');
        messageContainer.innerHTML = `
        <div class="coveo-user-actions-title">${l(UserActions.ID)}</div>
        <p>${l(UserActions.ID + '_no_actions_cause_not_enabled')}.</p>
        <p>${l(UserActions.ID + '_no_actions_contact_admin')}.</p>
        `;

        this.element.innerHTML = '';
        this.element.appendChild(messageContainer);
    }

    private showViewedByCustomer() {
        this.bind.onRootElement(ResultListEvents.newResultDisplayed, (args: IDisplayedNewResultEventArgs) => {
            if (Boolean(args.item.getElementsByClassName('CoveoViewedByCustomer').length)) {
                return;
            }
            if (this.inferResultListLayout() !== ResultLayoutType.TABLE) {
                const resultLastRow = '.coveo-result-row:last-child';
                args.item
                    .querySelector(resultLastRow)
                    .parentNode.appendChild(ViewedByCustomer.getViewedByCustomerResultRowDom(this.bindings, args.result));
            }
        });
    }

    private tagViewsOfUser() {
        Coveo.$$(this.root).on('buildingQuery', (e, args) => {
            try {
                args.queryBuilder.userActions = {
                    tagViewsOfUser: this.options.userId,
                };
            } catch (e) {
                this.logger.warn("CreatedBy Email wasn't found", e);
            }
        });
    }

    private inferResultListLayout(): ResultLayoutType {
        const resultLists = this.root.querySelectorAll<HTMLElement>(`${Component.computeSelectorForType(ResultList.ID)}:not(.coveo-hidden)`);
        const resultListLayoutTypes = [ResultLayoutType.CARD, ResultLayoutType.TABLE, ResultLayoutType.LIST] as string[];

        if (resultLists.length > 0 && resultListLayoutTypes.indexOf(resultLists[0].dataset.layout) !== -1) {
            return resultLists[0].dataset.layout as ResultLayoutType;
        }
        return ResultLayoutType.LIST;
    }
}

Initialization.registerAutoCreateComponent(UserActions);
