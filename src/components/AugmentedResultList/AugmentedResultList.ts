import { $$, ComponentOptions, IComponentBindings, Initialization, IQueryResult, IResultListOptions, IFieldOption } from 'coveo-search-ui';

/**
 * Interface for the object data returned from remote action.
 *
 * @export
 * @interface IObjectData
 */
export interface IObjectData {
    /**
     * Data specific to a result with matching object id.
     */
    objectData: {}[];
    /**
     * Data to add to every result with matching object id.
     */
    commonData: {};
}

/**
 * Generic interface for the response returned by the remote action method.
 *
 * @export
 * @interface IPromiseReturnArgs
 * @template T
 */
export interface IPromiseReturnArgs {
    data: IObjectData;
}

export interface AugmentedResultListOptions extends IResultListOptions {
    matchingIdField: IFieldOption;
    objectDataAction: (objectIds: String[]) => Promise<IPromiseReturnArgs>;
}

export class AugmentedResultList extends Coveo.ResultList implements IComponentBindings {
    static ID = 'AugmentedResultList';

    /**
     * @componentOptions
     */
    static options: AugmentedResultListOptions = {
        /**
         * The field to be used as matching ID between object and result.
         */
        matchingIdField: ComponentOptions.buildFieldOption({
            required: true,
        }),
        /**
         * The function used to fetch extra object information.
         */
        objectDataAction: ComponentOptions.buildCustomOption<(objectIds: String[]) => Promise<IPromiseReturnArgs>>(() => {
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

    protected enableAnimation() {
        if (!document.getElementById('overlay')) {
            $$(document.body).append($$('div', { id: 'overlay', class: 'modal-backdrop fade in' }).el);
        }
    }

    protected disableAnimation() {
        if (document.getElementById('overlay')) {
            document.getElementById('overlay').remove();
        }
    }

    public renderResults(resultElements: HTMLElement[], append = false): Promise<void> {
        const res = super.renderResults(resultElements, append);
        this.disableAnimation();
        return res;
    }

    public async buildResults(results: Coveo.IQueryResults): Promise<HTMLElement[]> {
        this.enableAnimation();
        const fieldString = this.getFieldString(this.options.matchingIdField);

        if (this.options.objectDataAction) {
            // Call remote action to fetch object data
            const remoteResults: IPromiseReturnArgs = await this.options
                .objectDataAction(this.getObjectPayload(results.results))
                .then((data) => {
                    return data;
                })
                .catch((ex) => {
                    this.logger.error('Unable to fetch object data.');
                    return null;
                });

            if (remoteResults && remoteResults.data) {
                // Merge remote action results with Coveo Results
                results.results.forEach((res: Coveo.IQueryResult) => {
                    const match = remoteResults.data.objectData.find((data) => {
                        return (data as any)[fieldString] === res.raw[fieldString];
                    });

                    // Attach data specific to each result/object
                    for (const key in match) {
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

        const ret = super.buildResults(results);
        return ret;
    }
}

Initialization.registerAutoCreateComponent(AugmentedResultList);
Initialization.registerComponentFields(AugmentedResultList.ID, [String(AugmentedResultList.options.matchingIdField)]);
