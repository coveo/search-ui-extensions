import { IQueryResult } from 'coveo-search-ui';

/**
 * List of possible event types triggered by the **AttachResult** component
 * when a user interacts with it.
 */
export enum AttachResultEvents {
    Attach = 'attach',
    Detach = 'detach'
}

/**
 * Arguments sent with the events coming from the **AttachResult** component.
 */
export interface IAttachResultEventArgs {
    /**
     * The **IQueryResult** that is attached to the **AttachResult** component.
     */
    queryResult: IQueryResult;
}
