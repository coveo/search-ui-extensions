import {
    $$,
    Component,
    ComponentOptions,
    IAnalyticsActionCause,
    IComponentBindings,
    Initialization,
    IQuerySuggestRequest,
    l,
    IQuerySuggestResponse,
    IAnalyticsNoMeta,
} from 'coveo-search-ui';
import './Strings';

export interface ITopQueriesOptions {
    /**
     * The parameters sent to the suggestion query.
     * The component uses this information to get better suggestions
     */
    suggestionQueryParams?: IQuerySuggestRequest;
    /**
     * The displayed title over the suggestions
     */
    title?: string;
    /**
     * Specifies the handler called when a suggestion is clicked.
     *
     * Default executes a search query using the suggestion
     */
    onClick?: (expression: string, component: TopQueries) => void;
}

/**
 * The TopQueries component suggests the top searched queries in the specific context and links the search results of the suggestions to the user
 */
export class TopQueries extends Component {
    static ID = 'TopQueries';

    /**
     * The possible options for the TopQueries component
     * @componentOptions
     */
    static options: ITopQueriesOptions = {
        suggestionQueryParams: ComponentOptions.buildJsonOption<IQuerySuggestRequest>({ defaultValue: { q: '' } }),
        title: ComponentOptions.buildStringOption({ defaultValue: l('TopQueries_title') }),
        onClick: ComponentOptions.buildCustomOption((s) => null, {
            defaultValue: (expression: string, component: TopQueries) => {
                component.usageAnalytics.logSearchEvent<IAnalyticsNoMeta>(TopQueries.topQueriesClickActionCause, {});
                component.queryStateModel.set('q', expression);
                component.queryController.executeQuery({ origin: component });
            },
        }),
    };

    public static topQueriesClickActionCause: IAnalyticsActionCause = {
        name: 'topQueriesClick',
        type: 'interface',
    };

    private listElem: HTMLUListElement;

    /**
     * Construct a TopQueries component.
     * @param element The HTML element bound to this component.
     * @param options The options that can be provided to this component.
     * @param bindings The bindings, or environment within which this component exists.
     */
    constructor(public element: HTMLElement, public options: ITopQueriesOptions, public bindings?: IComponentBindings) {
        super(element, TopQueries.ID, bindings);
        this.options = ComponentOptions.initComponentOptions(element, TopQueries, options);

        const titleElem = document.createElement('h2');
        titleElem.innerHTML = options.title;

        this.listElem = document.createElement('ul');

        this.element.appendChild(titleElem);
        this.element.appendChild(this.listElem);

        this.updateTopQueries();
    }

    public async updateTopQueries(suggestionQueryParams?: IQuerySuggestRequest): Promise<void> {
        this.show();

        let suggestions: IQuerySuggestResponse;
        try {
            suggestions = await this.queryController.getEndpoint().getQuerySuggest(suggestionQueryParams ?? this.options.suggestionQueryParams);
        } catch (err) {
            console.error(`Failed to fetch query suggestions: ${err}`);
            this.hide();
            return;
        }

        if (suggestions.completions.length == 0) {
            // Hide the widget if there are no query suggestions
            this.hide();
        } else {
            suggestions.completions.forEach((completion) => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.classList.add('coveo-link');
                a.addEventListener('click', () => {
                    this.options.onClick(completion.expression, this);
                });
                a.innerHTML = completion.expression;

                li.appendChild(a);
                this.listElem.appendChild(li);
            });
        }
    }

    private hide(): void {
        $$(this.element).addClass('coveo-hidden');
    }

    private show(): void {
        this.element.classList.remove('coveo-hidden');
    }
}

Initialization.registerAutoCreateComponent(TopQueries);
