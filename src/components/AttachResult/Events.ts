import { IQueryResult } from 'coveo-search-ui';

export enum AttachResultEvents {
    Attach = 'attach',
    Detach = 'detach'
}

export interface IAttachResultEventArgs {
    queryResult: IQueryResult;
}
