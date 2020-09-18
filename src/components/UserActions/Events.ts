import { IAnalyticsActionCause } from 'coveo-search-ui';

export const USER_ACTION_EVENT_TYPE = 'User Actions';

export class UserActionEvents {
    public static readonly load: IAnalyticsActionCause = Object.freeze({
        name: 'userActionLoad',
        type: USER_ACTION_EVENT_TYPE,
    });
    public static readonly submit: IAnalyticsActionCause = Object.freeze({
        name: 'userActionsSubmit',
        type: USER_ACTION_EVENT_TYPE,
    });
    public static readonly open: IAnalyticsActionCause = Object.freeze({
        name: 'openUserActions',
        type: USER_ACTION_EVENT_TYPE,
    });
}
