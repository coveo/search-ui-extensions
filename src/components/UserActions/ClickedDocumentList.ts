import { Component, IComponentBindings, Initialization, ComponentOptions, Template, HtmlTemplate, QueryUtils, l, get } from 'coveo-search-ui';
import { UserProfileModel, UserAction } from '../../models/UserProfileModel';
import { ExpandableList } from './ExpandableList';
import { UserActionType } from '../../rest/UserProfilingEndpoint';
import { duplicate } from '../../utils/icons';
import './Strings';

/**
 * Initialization options of the **ClickedDocumentList** class.
 */
export interface IClickedDocumentListOptions {
    /**
     * Number of Clicked Documents shown.
     *
     * Default: `3`
     * Minimum: `1`
     */
    numberOfItems: number;

    /**
     * Label of the list of Clicked Documents.
     *
     * Default: `Most Recent Clicked Documents`
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
export class ClickedDocumentList extends Component {
    /**
     * Identifier of the Search-UI component.
     */
    static readonly ID = 'ClickedDocumentList';

    /**
     * Default initialization options of the **ClickedDocumentList** class.
     */
    static readonly options: IClickedDocumentListOptions = {
        numberOfItems: ComponentOptions.buildNumberOption({
            defaultValue: 3,
            min: 1,
        }),
        listLabel: ComponentOptions.buildStringOption({
            defaultValue: 'Most Recent Clicked Documents',
        }),
        userId: ComponentOptions.buildStringOption({ required: true }),
        template: ComponentOptions.buildTemplateOption({
            defaultValue: HtmlTemplate.fromString(
                `<div class="coveo-list-row">
                    <div class="coveo-row-icon">${duplicate}</div>
                    <a class="CoveoResultLink"/a>
                </div>`,
                {
                    layout: 'list',
                }
            ),
        }),
    };

    private userProfileModel: UserProfileModel;
    private sortedDocumentsList: UserAction[];

    /**
     * Create an instance of **ClickedDocumentList**. Initialize is needed the **UserProfileModel** and fetch user actions related to the **UserId**.
     *
     * @param element Element on which to bind the component.
     * @param options Initialization options of the component.
     * @param bindings Bindings of the Search-UI environment.
     */
    constructor(public element: HTMLElement, public options: IClickedDocumentListOptions, public bindings: IComponentBindings) {
        super(element, ClickedDocumentList.ID, bindings);

        this.options = ComponentOptions.initComponentOptions(element, ClickedDocumentList, options);

        if (!this.options.userId) {
            this.disable();
            return;
        }

        this.userProfileModel = get(this.root, UserProfileModel) as UserProfileModel;

        this.userProfileModel.getActions(this.options.userId).then((actions) => {
            this.sortedDocumentsList = actions
                .filter((action) => action.document && action.type === UserActionType.Click)
                .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
                .reverse()
                .reduce(this.filterDuplicatesClickAction, [])
                .map((action) => {
                    action.document.searchInterface = this.searchInterface;
                    return action;
                });
            this.render();
        }, this.logger.error.bind(this.logger));
    }

    private filterDuplicatesClickAction(accumulator: UserAction[], action: UserAction): UserAction[] {
        return !accumulator.find((existing) => existing.raw.uri_hash === action.raw.uri_hash) ? [...accumulator, action] : accumulator;
    }

    private render() {
        new ExpandableList<UserAction>(this.element, this.sortedDocumentsList, {
            maximumItemsShown: this.sortedDocumentsList.length,
            minimumItemsShown: this.options.numberOfItems,
            transform: (action) => {
                QueryUtils.setStateObjectOnQueryResult(this.queryStateModel.get(), action.document);
                QueryUtils.setSearchInterfaceObjectOnQueryResult(this.searchInterface, action.document);
                return (<Promise<HTMLElement>>this.options.template.instantiateToElement(action.document, {
                    wrapInDiv: true,
                    checkCondition: true,
                    currentLayout: 'list',
                    responsiveComponents: this.searchInterface.responsiveComponents,
                })).then((element) => {
                    Initialization.automaticallyCreateComponentsInsideResult(element, action.document);
                    if (action.raw.origin_level_1) {
                        this.addTooltipElement(element, action);
                    }
                    return element;
                });
            },
            listLabel: this.options.listLabel,
            messageWhenEmpty: l(`${ClickedDocumentList.ID}_no_clicked_documents`),
            showMoreMessage: l(`${ClickedDocumentList.ID}_more`),
            showLessMessage: l(`${ClickedDocumentList.ID}_less`),
        });
    }

    private addTooltipElement(element: HTMLElement, action: UserAction) {
        const tooltip = document.createElement('div');
        tooltip.classList.add('coveo-tooltip-origin1');
        tooltip.innerText = action.raw.origin_level_1;

        const parentNode = element.querySelector('.CoveoResultLink').parentNode;
        const insertBeforeElement = element.querySelector('.CoveoResultLink');
        parentNode.insertBefore(tooltip, insertBeforeElement);
    }
}

Initialization.registerAutoCreateComponent(ClickedDocumentList);
