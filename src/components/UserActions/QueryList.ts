import { Component, IComponentBindings, Initialization, ComponentOptions, get, Omnibox, l } from 'coveo-search-ui';
import { UserProfileModel } from '../../models/UserProfileModel';
import { ExpandableList } from './ExpandableList';
import { search } from '../../utils/icons';
import './Strings';

const DEFAULT_TRANSFORMATION = () => (query: string) => {
    const container = document.createElement('div');
    container.classList.add('coveo-list-row');

    const icon = document.createElement('div');
    icon.classList.add('coveo-row-icon');
    icon.innerHTML = search;
    
    const span = document.createElement('span');
    span.classList.add('coveo-content');
    span.innerHTML = query;

    container.appendChild(icon);
    container.appendChild(span);

    return Promise.resolve(container);
};

/**
 * Initialization options of the **QueryList** class.
 */
export interface IQueryListOptions {
    /**
     * Number of User Queries shown.
     *
     * Default: `4`
     * Minimum: `1`
     */
    numberOfItems: number;

    /**
     * Label of the list of User Queries.
     *
     * Default: `Recent Queries`
     */
    listLabel: string;

    /**
     * Function that tranform a query of the list into a HTMLElement representation.
     *
     * Default: Create a span element such as `<span class="coveo-content">My Query</span>`.
     *
     * @param query The query to transform.
     */
    transform(query: string): Promise<HTMLElement>;

    /**
     * Identifier of the user from which Clicked Documents are shown.
     *
     * **Require**
     */
    userId: string;
}

/**
 * Display the list of the most recent queries of a user.
 */
export class QueryList extends Component {
    /**
     * Identifier of the Search-UI component.
     */
    static readonly ID = 'QueryList';

    /**
     * Default initialization options of the **QueryList** class.
     */
    static readonly options: IQueryListOptions = {
        numberOfItems: ComponentOptions.buildNumberOption({
            defaultValue: 4,
            min: 1,
            required: true
        }),

        listLabel: ComponentOptions.buildStringOption({
            defaultValue: 'Recent Queries'
        }),

        transform: ComponentOptions.buildCustomOption<(query: string) => Promise<HTMLElement>>(DEFAULT_TRANSFORMATION, {
            defaultValue: DEFAULT_TRANSFORMATION()
        }),

        userId: ComponentOptions.buildStringOption({ required: true })
    };

    private userProfileModel: UserProfileModel;
    private sortedQueryList: string[];

    /**
     * Create an instance of **QueryList**. Initialize is needed the **UserProfileModel** and fetch user actions related to the **UserId**.
     *
     * @param element Element on which to bind the component.
     * @param options Initialization options of the component.
     * @param bindings Bindings of the Search-UI environment.
     */
    constructor(public element: HTMLElement, public options: IQueryListOptions, public bindings: IComponentBindings) {
        super(element, QueryList.ID, bindings);

        this.options = ComponentOptions.initComponentOptions(element, QueryList, options);
        this.userProfileModel = get(this.root, UserProfileModel) as UserProfileModel;
        this.userProfileModel.getActions(this.options.userId).then(actions => {
            this.sortedQueryList = [...actions]
                .filter(action => action.query)
                .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
                .reverse()
                .map(action => action.query)
                .reduce(this.removeDuplicateQueries, []);
            this.render();
        }, this.logger.error.bind(this.logger));
    }

    private removeDuplicateQueries(acc: string[], query: string): string[] {
        return acc.indexOf(query) === -1 ? [...acc, query] : acc;
    }

    private render() {
        new ExpandableList<string>(this.element, this.sortedQueryList, {
            maximumItemsShown: this.sortedQueryList.length,
            minimumItemsShown: this.options.numberOfItems,
            transform: (query: string) => this.options.transform(query).then(this.makeClickable.bind(this, query)),
            listLabel: this.options.listLabel,
            messageWhenEmpty: l(`${QueryList.ID}_no_queries`),
            showMoreMessage: l(`${QueryList.ID}_more`),
            showLessMessage: l(`${QueryList.ID}_less`)
        });
    }

    /**
     * Make a list item element generate a query when click if an omnibox is present.
     * @param query The query to generate.
     * @param listItem  The list item element.
     */
    private makeClickable(query: string, listItem: HTMLElement) {
        const omniboxElement = this.root.querySelector<HTMLElement>('.CoveoOmnibox');
        if (omniboxElement != null) {
            listItem.addEventListener('click', () => {
                (get(omniboxElement, Omnibox, true) as Omnibox).setText(query);

                this.usageAnalytics.logSearchEvent({ name: 'userActionsSubmit', type: 'User Actions' }, {});
                this.queryController.executeQuery();
            });

            listItem.style.cursor = 'pointer';
        }
        return listItem;
    }
}

Initialization.registerAutoCreateComponent(QueryList);
