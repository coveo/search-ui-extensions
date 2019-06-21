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

export interface IAnalyticsAttachedResultsFilterMeta {
    filteredAttachedResults: boolean;
}

export interface IFilterAttachedResultsOptions {
    /** Specifies the text displayed next to the checkbox. */
    text?: string;
    /** The function that is called when retrieving uri hashes to filter. */
    getUriHashes?: () => string[];
}

/**
 * The FilterAttachedResults component allows a user to click a checkbox to
 * search only for attached results.
 */
export class FilterAttachedResults extends Component {
    static ID = 'FilterAttachedResults';

    private checkbox: Checkbox;

    static options: IFilterAttachedResultsOptions = {
        text: ComponentOptions.buildStringOption({
            defaultValue: 'Filter Attached Results'
        }),
        getUriHashes: ComponentOptions.buildCustomOption(
            name => () => new Array<string>(),
            { defaultFunction: () => () => new Array<string>() }
        )
    };

    constructor(
        public element: HTMLElement,
        public options: IFilterAttachedResultsOptions,
        public bindings?: IComponentBindings
    ) {
        super(element, FilterAttachedResults.ID, bindings);

        this.options = ComponentOptions.initComponentOptions(
            element,
            FilterAttachedResults,
            options
        );

        this.initialize();

        this.queryStateModel.registerNewAttribute(
            QueryStateModel.getFacetId(FilterAttachedResults.ID),
            false
        );
        this.bind.onRootElement(
            QueryEvents.buildingQuery,
            (args: IBuildingQueryEventArgs) => this.handleBuildingQuery(args)
        );
        this.bind.onQueryState(
            'change:',
            QueryStateModel.getFacetId(FilterAttachedResults.ID),
            (args: IAttributesChangedEventArg) =>
                this.handleQueryStateChange(args)
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
        let mainSection = $$('div', { className: 'CoveoFacet' });
        let headerSection = $$('div', { className: 'coveo-facet-header' });
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
        return new Checkbox(
            checkbox => this.handleCheckboxChange(),
            this.options.text
        );
    }

    private handleCheckboxChange() {
        this.queryStateModel.set(
            QueryStateModel.getFacetId(FilterAttachedResults.ID),
            this.checkbox.isSelected()
        );
        this.triggerQuery();
    }

    private triggerQuery() {
        this.usageAnalytics.logSearchEvent<IAnalyticsAttachedResultsFilterMeta>(
            { name: 'filterAttachedResults', type: 'misc' },
            { filteredAttachedResults: this.checkbox.isSelected() }
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
        if (this.checkbox.isSelected()) {
            const uriHashes = this.options.getUriHashes();
            args.queryBuilder.advancedExpression.add(
                '@urihash=(' + uriHashes.join(',') + ')'
            );
        }
    }
}

Initialization.registerAutoCreateComponent(FilterAttachedResults);
