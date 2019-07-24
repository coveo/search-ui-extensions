import {
    Component,
    IComponentBindings,
    Initialization,
    ComponentOptions,
    IQueryResult,
    Template,
    HtmlTemplate,
    QueryUtils,
    l
} from 'coveo-search-ui';
import { UserProfileModel } from '../../models/UserProfileModel';
import { InitializationUtils } from '../../utils/initialization';
import { ExpandableList } from './ExpandableList';
import './Strings';
import { UserActionType } from '../../rest/UserProfilingEndpoint';

/**
 * Initialization options of the **RecentClickedDocuments** class.
 */
export interface IRecentClickedDocuments {
    /**
     * Number of Clicked Documents shown.
     *
     * Default: `4`
     * Minimum: `1`
     */
    numberOfItems: number;

    /**
     * Label of the list of Clicked Documents.
     *
     * Default: `Recent Clicked Documents`
     */
    listLabel: string;

    /**
     * Template used to display Clicked Documents.
     * Default: `<a class="CoveoResultLink"></a>`
     */
    template: Template;

    /**
     * Identifier of the user from which Clicked Documents are shown.
     *
     * **Require**
     */
    userId: string;
}

/**
 * Display the list of the most recent clicked documents of a user.
 */
export class RecentClickedDocuments extends Component {
    /**
     * Identifier of the Search-UI component.
     */
    static readonly ID = 'RecentClickedDocuments';

    /**
     * Default initialization options of the **RecentClickedDocuments** class.
     */
    static readonly options: IRecentClickedDocuments = {
        numberOfItems: ComponentOptions.buildNumberOption({
            defaultValue: 4,
            min: 1
        }),
        listLabel: ComponentOptions.buildStringOption({
            defaultValue: 'Recent Clicked Documents'
        }),
        userId: ComponentOptions.buildStringOption({ required: true }),
        template: ComponentOptions.buildTemplateOption({
            defaultValue: HtmlTemplate.fromString('<a class="CoveoResultLink"></a>', {
                layout: 'list'
            })
        })
    };

    private userProfileModel: UserProfileModel;
    private sortedDocumentsList: IQueryResult[];

    /**
     * Create an instance of **RecentClickedDocuments**. Initialize is needed the **UserProfileModel** and fetch user actions related to the **UserId**.
     *
     * @param element Element on which to bind the component.
     * @param options Initialization options of the component.
     * @param bindings Bindings of the Search-UI environment.
     */
    constructor(public element: HTMLElement, public options: IRecentClickedDocuments, public bindings: IComponentBindings) {
        super(element, RecentClickedDocuments.ID, bindings);

        this.options = ComponentOptions.initComponentOptions(element, RecentClickedDocuments, options);
        this.userProfileModel = InitializationUtils.getUserProfileModel(this.root, this.bindings);
        this.userProfileModel.getActions(this.options.userId).then(actions => {
            this.sortedDocumentsList = actions
                .filter(action => action.document && action.type === UserActionType.Click)
                .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
                .reverse()
                .map(action => action.document);
            this.render();
        }, this.logger.error.bind(this.logger));
    }

    private render() {
        new ExpandableList<IQueryResult>(this.element, this.sortedDocumentsList, {
            maximumItemsShown: this.sortedDocumentsList.length,
            minimumItemsShown: this.options.numberOfItems,
            transform: result => {
                QueryUtils.setStateObjectOnQueryResult(this.queryStateModel.get(), result);
                QueryUtils.setSearchInterfaceObjectOnQueryResult(this.searchInterface, result);
                return (<Promise<HTMLElement>>this.options.template.instantiateToElement(result, {
                    wrapInDiv: true,
                    checkCondition: true,
                    currentLayout: 'list',
                    responsiveComponents: this.searchInterface.responsiveComponents
                })).then(element => {
                    Initialization.automaticallyCreateComponentsInsideResult(element, result);
                    return element;
                });
            },
            listLabel: this.options.listLabel,
            messageWhenEmpty: l(`${RecentClickedDocuments.ID}_no_clicked_documents`),
            showMoreMessage: l(`${RecentClickedDocuments.ID}_more`),
            showLessMessage: l(`${RecentClickedDocuments.ID}_less`)
        });
    }
}

Initialization.registerAutoCreateComponent(RecentClickedDocuments);
