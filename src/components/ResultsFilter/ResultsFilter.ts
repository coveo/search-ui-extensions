import {
    Component,
    ComponentOptions,
    IComponentBindings,
    $$,
    Initialization,
    Checkbox,
    QueryEvents,
    IBuildingQueryEventArgs,
    QueryStateModel,
    load,
    IAttributesChangedEventArg
} from 'coveo-search-ui';

export interface IAnalyticsFilteredResultsMeta {
    filteredResults: boolean;
}

export interface IResultsFilterOptions {
    /** Specifies the text displayed next to the checkbox. */
    text?: string;
    /** The field on which to filter results using the values provided. */
    field?: string;
    /** The function that is called when retrieving uri hashes to filter. */
    getValues?: () => string[];
}

/**
 * The ResultsFilter component allows a user to click a checkbox to
 * search only for matching results.
 */
export class ResultsFilter extends Component {
    static ID = 'ResultsFilter';

    private checkbox: Checkbox;

    static options: IResultsFilterOptions = {
        text: ComponentOptions.buildStringOption({
            defaultValue: 'Filter Results'
        }),
        field: ComponentOptions.buildStringOption({
            defaultValue: 'urihash'
        }),
        getValues: ComponentOptions.buildCustomOption(name => () => new Array<string>(), {
            defaultFunction: () => () => new Array<string>()
        })
    };

    constructor(
        public element: HTMLElement,
        public options: IResultsFilterOptions,
        public bindings?: IComponentBindings
    ) {
        super(element, ResultsFilter.ID, bindings);

        this.options = ComponentOptions.initComponentOptions(element, ResultsFilter, options);

        this.initialize();

        this.queryStateModel.registerNewAttribute(QueryStateModel.getFacetId(ResultsFilter.ID), false);
        this.bind.onRootElement(QueryEvents.buildingQuery, this.handleBuildingQuery.bind(this));
        this.bind.onQueryState(
            'change:',
            QueryStateModel.getFacetId(ResultsFilter.ID),
            this.handleQueryStateChange.bind(this)
        );
    }

    public isSelected(): boolean {
        return this.checkbox && this.checkbox.isSelected();
    }

    public toggle(): void {
        if (this.isSelected()) {
            this.checkbox.reset();
        } else {
            this.checkbox.select(true);
        }
    }

    protected initialize(): void {
        const mainSection = $$('div', { className: 'CoveoFacet' });
        const headerSection = $$('div', { className: 'coveo-facet-header' });
        const labelDiv = $$('label', {
            className: 'coveo-facet-value-label-wrapper'
        }).el;
        headerSection.append(labelDiv);
        mainSection.append(headerSection.el);

        this.createCheckbox().then(checkbox => {
            this.checkbox = checkbox;
            labelDiv.appendChild(this.checkbox.getElement());
        });

        this.element.appendChild(mainSection.el);
    }

    private async createCheckbox(): Promise<Checkbox> {
        if (Coveo.Checkbox === undefined) {
            await load('Checkbox');
        }
        return new Checkbox(this.handleCheckboxChange.bind(this), this.options.text);
    }

    private handleCheckboxChange(checkbox: Checkbox) {
        this.queryStateModel.set(QueryStateModel.getFacetId(ResultsFilter.ID), this.checkbox.isSelected());
        this.triggerQuery();
    }

    private triggerQuery() {
        this.usageAnalytics.logSearchEvent<IAnalyticsFilteredResultsMeta>(
            { name: ResultsFilter.ID, type: 'misc' },
            { filteredResults: this.isSelected() }
        );
        this.queryController.executeQuery({ origin: this });
    }

    private handleQueryStateChange(args: IAttributesChangedEventArg) {
        if ((args as any)['value']) {
            this.checkbox.select(false);
        } else {
            this.checkbox.reset();
        }
    }

    private handleBuildingQuery(args: IBuildingQueryEventArgs) {
        if (this.isSelected()) {
            const values = this.options.getValues();
            args.queryBuilder.advancedExpression.add(`@${this.options.field}=(${values.join(',')})`);
        }
    }
}

Initialization.registerAutoCreateComponent(ResultsFilter);
