import { Translation, Language } from '../../utils/translation';

Translation.register(Language.English, {
    UserActions: 'User Actions',
    UserActions_no_actions_title: 'No actions available for this user',
    UserActions_no_actions_causes_title: 'Possible causes',
    UserActions_no_actions_cause_not_enabled: 'User actions are not enabled for your organization',
    UserActions_no_actions_cause_not_associated: 'There are no user actions associated with the user',
    UserActions_no_actions_cause_case_too_old: 'The case is too old to detect related actions',
    UserActions_no_actions_contact_admin: 'Contact your administrator for help',
    UserActions_enable_prompt: 'The User Action feature is not activated for your organization.\nTo activate it, contact Coveo Support.',

    QueryList_more: 'Show More',
    QueryList_less: 'Show Less',
    QueryList_no_queries: 'No queries made by this user',

    ClickedDocumentList_more: 'Show More',
    ClickedDocumentList_less: 'Show Less',
    ClickedDocumentList_no_clicked_documents: 'No document clicked by this user',

    UserActivity_start_date: 'Start Date',
    UserActivity_start_time: 'Start Time',
    UserActivity_duration: 'Duration',
    UserActivity_other_event: 'Other Event',
    UserActivity_other_events: 'Other Events',
    UserActivity_no_actions_timeline: 'No actions to display in the timeline',
    UserActivity_no_actions_cause_filtered: 'All the actions were filtered',

    UserActivity_search: 'Query',
    UserActivity_query: 'User Query',
    UserActivity_click: 'Clicked Document',
    UserActivity_view: 'Page View',
    UserActivity_custom: 'Custom Action',
    UserActivity_ticketCreated: 'Ticket Created',
    UserActivity_showNewSession: 'Show new session',
    UserActivity_showPastSession: 'Show past session',
    UserActivity_showMore: 'Show More',
    UserActivity_showMoreActions: 'More Actions',
    UserActivity_session: 'Session',
    UserActivity_emptySearch: 'Empty Search',
    UserActivity_invalidDate: 'Invalid date for ticket creation',
});
