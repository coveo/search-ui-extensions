import { ComponentOptions, IComponentBindings, Initialization, IQueryResult, IResultListOptions, IFieldOption } from 'coveo-search-ui';

/**
 * Interface for the data returned from external fetch action.
 *
 * @export
 * @interface IAugmentData
 */
export interface IAugmentData {
    /**
     * Data specific to a result with matching object id.
     */
    resultData: {}[];
    /**
     * Data to add to every result with matching object id.
     */
    commonData: {};
}

/**
 * Generic interface for the response returned by the external fetch action.
 *
 * @export
 * @interface IPromiseReturnArgs
 * @template T
 */
export interface IPromiseReturnArgs<T> {
    data: T;
}

export interface AugmentedResultListOptions extends IResultListOptions {
    matchingIdField: IFieldOption;
    fetchAugmentData: (objectIds: String[]) => Promise<IPromiseReturnArgs<IAugmentData>>;
    matchingFunction: (augmentData: any, queryResult: IQueryResult) => boolean;
}

export class AugmentedResultList extends Coveo.ResultList implements IComponentBindings {
    static ID = 'AugmentedResultList';

    /**
     * @componentOptions
     */
    static options: AugmentedResultListOptions = {
        /**
         * The field to be used as matching ID between augment data and result.
         */
        matchingIdField: ComponentOptions.buildFieldOption({
            required: true,
        }),
        /**
         * The function used to fetch extra result information.
         */
        fetchAugmentData: ComponentOptions.buildCustomOption<(objectIds: String[]) => Promise<IPromiseReturnArgs<IAugmentData>>>(() => {
            return null;
        }),
        /**
         * The function to use to determine a match between augment data and query results.
         */
        matchingFunction: ComponentOptions.buildCustomOption<(augmentData: any, queryResult: IQueryResult) => boolean>(() => {
            return null;
        }),
    };

    /**
     * Creates a new `AugmentedResultList` component.
     * @param element The HTMLElement on which to instantiate the component.
     * @param options The options for the `ResultList` component.
     * @param bindings The bindings that the component requires to function normally. If not set, these will be
     * automatically resolved (with a slower execution time).
     */
    constructor(public element: HTMLElement, public options: AugmentedResultListOptions, public bindings: IComponentBindings) {
        super(element, ComponentOptions.initComponentOptions(element, AugmentedResultList, options), bindings, AugmentedResultList.ID);
        this.options.matchingFunction = this.options.matchingFunction ?? this.defaultMatchingFunction;
    }

    private defaultMatchingFunction = (augmentData: any, queryResult: IQueryResult) => {
        const fieldName = this.getMatchingFieldString();
        return augmentData[fieldName] === queryResult.raw[fieldName];
    };

    private getObjectPayload(results: IQueryResult[]): String[] {
        const field = this.getMatchingFieldString();
        return results.filter((result) => result.raw && result.raw[field]).map((result) => result.raw[field]);
    }

    private getMatchingFieldString() {
        return this.options.matchingIdField.replace('@', '');
    }

    public renderResults(resultElements: HTMLElement[], append = false): Promise<void> {
        return super.renderResults(resultElements, append);
    }

    public async buildResults(queryResults: Coveo.IQueryResults): Promise<HTMLElement[]> {
        let remoteResults: IPromiseReturnArgs<IAugmentData>;
        const fieldName = this.getMatchingFieldString();

        if (this.options.fetchAugmentData) {
            try {
                // Call remote action to fetch augmenting data
                remoteResults = await this.options.fetchAugmentData(this.getObjectPayload(queryResults.results));
            } catch (e) {
                this.logger.error(['Unable to fetch augment data.', e]);
                return null;
            }

            if (remoteResults?.data) {
                // Merge augmenting data with Coveo Results
                queryResults.results.forEach((res: Coveo.IQueryResult) => {
                    const match: any = remoteResults.data.resultData.find((data: any) => this.options.matchingFunction(data, res));

                    // Attach data specific to each result/object
                    for (const key in match) {
                        if (key.toLowerCase() !== fieldName && Boolean(res.raw[key.toLowerCase()])) {
                            this.logger.warn(`The ${key} field was overwritten on result: ${res.title}`);
                        }
                        res.raw[key.toLowerCase()] = match[key];
                    }

                    // Attach data common to all results
                    for (const key in remoteResults.data.commonData) {
                        res.raw[key.toLowerCase()] = (remoteResults.data.commonData as any)[key];
                    }
                });
            }
        } else {
            this.logger.error('No objectDataAction is defined.');
        }

        return super.buildResults(queryResults);
    }
}

Initialization.registerAutoCreateComponent(AugmentedResultList);
Initialization.registerComponentFields(AugmentedResultList.ID, [String(AugmentedResultList.options.matchingIdField)]);
