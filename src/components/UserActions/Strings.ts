import { Translation, Language } from '../../utils/translation';

Translation.register(Language.English, {
    UserActions_no_actions: 'No actions available for this user',
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

    UserActivity_search: 'Query',
    UserActivity_query: 'User Query',
    UserActivity_click: 'Clicked Document',
    UserActivity_view: 'Page View',
    UserActivity_custom: 'Custom Action',
});
