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

export interface IDocumentsClickedOptions {
  max: number;
  nbShowed: number;
  title: string;
  template: Template;
  userId: string;
}

export class DocumentsClicked extends Component {
  static ID = 'DocumentsClicked';
  static options: IDocumentsClickedOptions = {
    nbShowed: ComponentOptions.buildNumberOption({
      defaultValue: 4,
      min: 1,
      required: true
    }),

    max: ComponentOptions.buildNumberOption({
      defaultValue: 8,
      min: 1,
      required: true
    }),

    title: ComponentOptions.buildStringOption({
      defaultValue: 'Documents Clicked'
    }),

    template: ComponentOptions.buildTemplateOption({
      defaultValue: HtmlTemplate.fromString('<a class="CoveoResultLink"></a>', {
        layout: 'list'
      })
    }),

    userId: ComponentOptions.buildStringOption({ required: true })
  };

  private userProfileModel: UserProfileModel;
  private all: IQueryResult[];

  constructor(public element: HTMLElement, public options: IDocumentsClickedOptions, public bindings: IComponentBindings) {
    super(element, DocumentsClicked.ID, bindings);

    this.options = ComponentOptions.initComponentOptions(element, DocumentsClicked, options);
    this.userProfileModel = InitializationUtils.getUserProfileModel(this.root, this.bindings.searchInterface);
    this.userProfileModel.getDocuments(this.options.userId).then(documents => {
      this.all = documents;
      this.render();
    }, this.logger.error.bind(this.logger));
  }

  private render() {
    new ExpandableList<IQueryResult>(this.element, this.all, {
      max: this.options.max,
      min: this.options.nbShowed,
      itemProcessor: result => {
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
      title: this.options.title,
      messageWhenEmpty: l('user_actions_no_clicked_documents')
    });
  }
}

Initialization.registerAutoCreateComponent(DocumentsClicked);
