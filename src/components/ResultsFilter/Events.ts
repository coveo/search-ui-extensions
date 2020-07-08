/**
 * Events triggered by the **ResultsFilter** component.
 */
export enum ResultsFilterEvents {
    Click = 'click',
}

/**
 * Arguments sent with the events coming from the **ResultsFilter** component.
 */
export interface IResultsFilterEventArgs {
    /**
     * Whether the filter is currently checked or not.
     */
    checked: boolean;
}
