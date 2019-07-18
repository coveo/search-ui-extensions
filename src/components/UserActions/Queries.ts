import { Component, IComponentBindings, Initialization, ComponentOptions, get, Omnibox, l } from 'coveo-search-ui';
import { UserProfileModel } from '../../models/UserProfileModel';
import { InitializationUtils } from '../../utils/initialization';
import { ExpandableList } from './ExpandableList';
import './Strings';

const DEFAULT_PROCESSOR = () => (query: string) => {
  const el = document.createElement('span');
  el.classList.add('coveo-content');
  el.innerHTML = query;
  return Promise.resolve(el);
};

export interface IQueriesOptions {
  max: number;
  showed: number;
  title: string;
  itemProcessor(query: string): Promise<HTMLElement>;
  userId: string;
}

export class Queries extends Component {
  static ID = 'Queries';
  static options: IQueriesOptions = {
    showed: ComponentOptions.buildNumberOption({
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
      defaultValue: 'Queries'
    }),

    itemProcessor: ComponentOptions.buildCustomOption<(query: string) => Promise<HTMLElement>>(DEFAULT_PROCESSOR, {
      defaultValue: DEFAULT_PROCESSOR()
    }),

    userId: ComponentOptions.buildStringOption({ required: true })
  };

  private userProfileModel: UserProfileModel;
  private all: string[];

  constructor(public element: HTMLElement, public options: IQueriesOptions, public bindings: IComponentBindings) {
    super(element, Queries.ID, bindings);

    this.options = ComponentOptions.initComponentOptions(element, Queries, options);
    this.userProfileModel = InitializationUtils.getUserProfileModel(this.root, this.bindings.searchInterface);
    this.userProfileModel.getQueries(this.options.userId).then(queries => {
      this.all = queries;
      this.render();
    }, this.logger.error.bind(this.logger));
  }

  private render() {
    new ExpandableList<string>(this.element, this.all, {
      max: this.options.max,
      min: this.options.showed,
      itemProcessor: query => {
        return this.options.itemProcessor(query).then(element => {
          const omniboxElement = this.root.querySelector<HTMLElement>('.CoveoOmnibox');
          if (omniboxElement) {
            element.addEventListener('click', () => {
              if (omniboxElement != null) {
                const omnibox = get(omniboxElement, Omnibox, true) as Omnibox;
                omnibox.setText(query);
                this.usageAnalytics.logSearchEvent({ name: 'userActionsSubmit', type: 'user actions' }, {});
                this.queryController.executeQuery();
              }
            });

            element.style.cursor = 'pointer';
          }
          return element;
        });
      },
      title: this.options.title,
      messageWhenEmpty: l('user_actions_no_queries')
    });
  }
}

Initialization.registerAutoCreateComponent(Queries);
