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
    resultData: any[];
    /**
     * Data to add to every result with matching object id.
     */
    commonData: any;
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
    }

    private getObjectPayload(results: IQueryResult[]): String[] {
        const field = this.getFieldString(this.options.matchingIdField);
        if (results.length > 0) {
            return results.filter((result) => result.raw && result.raw[field]).map((result) => result.raw[field]);
        }
        return [];
    }

    private getFieldString(fieldName: IFieldOption) {
        return fieldName.replace('@', '');
    }

    public renderResults(resultElements: HTMLElement[], append = false): Promise<void> {
        const res = super.renderResults(resultElements, append);
        return res;
    }

    public async buildResults(queryResults: Coveo.IQueryResults): Promise<HTMLElement[]> {
        const fieldString = this.getFieldString(this.options.matchingIdField);

        if (this.options.fetchAugmentData) {
            let remoteResults: IPromiseReturnArgs<IAugmentData>;
            try {
                // Call remote action to fetch augmenting data
                remoteResults = await this.options.fetchAugmentData(this.getObjectPayload(queryResults.results));
            } catch (e) {
                this.logger.error(['Unable to fetch augment data.', e]);
                return null;
            }

            if (remoteResults?.data) {
                // Merge remote action results with Coveo Results
                queryResults.results.forEach((res: Coveo.IQueryResult) => {
                    const match = remoteResults.data.resultData.find((data) => {
                        return (data as any)[fieldString] === res.raw[fieldString];
                    });

                    // Attach data specific to each result/object
                    for (const key in match) {
                        if (Boolean(res.raw[key.toLowerCase()])) {
                            this.logger.warn(`The ${key} field was overwritten on result: ${res.title}`);
                        }
                        res.raw[key.toLowerCase()] = (match as any)[key];
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

        const ret = super.buildResults(queryResults);
        return ret;
    }
}

Initialization.registerAutoCreateComponent(AugmentedResultList);
Initialization.registerComponentFields(AugmentedResultList.ID, [String(AugmentedResultList.options.matchingIdField)]);
