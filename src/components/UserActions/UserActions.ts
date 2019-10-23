import {
    Component,
    IComponentBindings,
    Initialization,
    ComponentOptions,
    QueryEvents,
    l,
    get,
    ResultListEvents,
    IDisplayedNewResultEventArgs
} from 'coveo-search-ui';
import { ResponsiveUserActions } from './ResponsiveUserActions';
import { arrowDown } from '../../utils/icons';
import { ClickedDocumentList } from './ClickedDocumentList';
import { QueryList } from './QueryList';
import { UserActivity } from './UserActivity';
import { UserProfileModel } from '../../Index';
import './Strings';
import { ViewedByCustomer } from '../ViewedByCustomer/ViewedByCustomer';

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
     * Default: `User Recent Activity`
     */
    activityLabel: string;

    /**
     * Whether or not to add the ViewedByCustomer component
     *
     * Default: `True`
     */
    viewedByCustomer: Boolean;
}

/**
 * Display a panel that contains a summary of a user session and that also contains detailed information about user actions.
 */
export class UserActions extends Component {
    /**
     * Identifier of the Search-UI component.
     */
    static readonly ID = 'UserActions';

    /**
     * Default initialization options of the **UserActions** class.
     */
    static readonly options: IUserActionsOptions = {
        userId: ComponentOptions.buildStringOption({ required: true }),
        buttonLabel: ComponentOptions.buildStringOption({
            defaultValue: 'User Actions'
        }),
        summaryLabel: ComponentOptions.buildStringOption({
            defaultValue: 'Session Summary'
        }),
        activityLabel: ComponentOptions.buildStringOption({
            defaultValue: "User's Recent Activity"
        }),
        viewedByCustomer: ComponentOptions.buildBooleanOption({
            defaultValue: true
        })
    };

    private static readonly USER_ACTION_OPENED = 'coveo-user-actions-opened';
    private isVisible: boolean;

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

        (get(this.root, UserProfileModel) as UserProfileModel)
            .getActions(this.options.userId)
            .then(actions => (actions.length > 0 ? this.render() : this.renderNoActions()))
            .catch(() => this.renderNoActions());

        if (this.options.viewedByCustomer) {
            this.showViewedByCustomer();
        }

        ResponsiveUserActions.init(this.root, this);

        this.tagViewsOfUser();

        this.bind.onRootElement(QueryEvents.newQuery, () => this.hide());

        this.hide();
    }

    /**
     * Make the panel hiddem.
     */
    public hide() {
        if (this.isVisible) {
            (get(this.root, UserProfileModel) as UserProfileModel).deleteActions(this.options.userId);
            this.root.classList.remove(UserActions.USER_ACTION_OPENED);
            this.isVisible = false;
        }
    }

    /**
     * Make the panel visible.
     */
    public show() {
        if (!this.isVisible) {
            (get(this.root, UserProfileModel) as UserProfileModel)
                .getActions(this.options.userId)
                .then(actions => (actions.length > 0 ? this.render() : this.renderNoActions()))
                .catch(e => (e.statusCode === 404 ? this.renderEnablePrompt() : this.renderNoActions()));

            this.bindings.usageAnalytics.logCustomEvent({ name: 'openUserActions', type: 'User Actions' }, {}, this.element);
            this.root.classList.add(UserActions.USER_ACTION_OPENED);
            this.isVisible = true;
        }
    }

    /**
     * Toggle the visibility of the panel.
     */
    public toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
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

        elements.forEach(el => foldable.appendChild(el));

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
        Initialization.automaticallyCreateComponentsInside(element, {
            options: {
                ...this.searchInterface.options.originalOptionsObject,
                QueryList: {
                    userId: this.options.userId
                },
                ClickedDocumentList: {
                    userId: this.options.userId
                },
                UserActivity: {
                    userId: this.options.userId
                }
            },
            bindings: this.bindings
        });
    }

    private render() {
        const element = document.createElement('div');

        const summarySection = this.buildAccordion(this.options.summaryLabel, [
            this.buildCoveoElement(ClickedDocumentList),
            this.buildCoveoElement(QueryList)
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
        const element = document.createElement('div');
        element.classList.add('coveo-no-actions');
        element.innerText = l(`${UserActions.ID}_no_actions`);

        this.element.innerHTML = '';
        this.element.appendChild(element);
    }

    private renderEnablePrompt() {
        const element = document.createElement('div');
        element.classList.add('coveo-no-actions');
        element.innerText = l(`${UserActions.ID}_enable_prompt`);
        element.style.padding = '1.5em';

        this.element.innerHTML = '';
        this.element.appendChild(element);
    }

    private showViewedByCustomer() {
        this.bind.onRootElement(ResultListEvents.newResultDisplayed, (args: IDisplayedNewResultEventArgs) => {
            if (Boolean(args.item.getElementsByClassName('CoveoViewedByCustomer').length)) {
                return;
            }
            const viewedByCustomerElement = document.createElement('span');
            new ViewedByCustomer(viewedByCustomerElement, undefined, this.bindings, args.result);
            const resultLastRow = '.coveo-result-row:last-child .coveo-result-cell';
            args.item.querySelector(resultLastRow).appendChild(viewedByCustomerElement);
        });
    }

    private tagViewsOfUser() {
        Coveo.$$(this.root).on('buildingQuery', (e, args) => {
            try {
                args.queryBuilder.userActions = {
                    tagViewsOfUser: this.options.userId
                };
            } catch (e) {
                this.logger.warn("CreatedBy Email wasn't found", e);
            }
        });
    }
}

Initialization.registerAutoCreateComponent(UserActions);
