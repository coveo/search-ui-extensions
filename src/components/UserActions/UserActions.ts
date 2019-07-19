import { Component, IComponentBindings, Initialization, ComponentOptions, QueryEvents } from 'coveo-search-ui';

import { InitializationUtils } from '../../utils/initialization';
import { ResponsiveUserActions } from './ResponsiveUserActions';
import { arrowDown } from '../../utils/icons';
import './Strings';

export interface UserActionsOptions {
  userId: string;
  title: string;
}

export class UserActions extends Component {
  static ID = 'UserActions';
  static options: UserActionsOptions = {
    userId: ComponentOptions.buildStringOption({ required: true }),
    title: ComponentOptions.buildStringOption({
      defaultValue: 'User Actions',
      required: true
    })
  };

  private static USER_ACTION_OPENNED = 'coveo-user-actions-opened';

  private isVisible: boolean;

  constructor(public element: HTMLElement, public options: UserActionsOptions, public bindings: IComponentBindings) {
    super(element, UserActions.ID, bindings);

    this.options = ComponentOptions.initComponentOptions(element, UserActions, options);

    InitializationUtils.getUserProfileModel(this.root, this.searchInterface).getActions(this.options.userId);

    ResponsiveUserActions.init(this.root, this);

    this.bind.onRootElement(QueryEvents.newQuery, () => this.hide());

    this.hide();
  }

  public toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public show() {
    if (!this.isVisible) {
      this.bindings.usageAnalytics.logCustomEvent({ name: 'openUserActions', type: 'User Actions' }, {}, this.element);
      this.render();
      this.root.classList.add(UserActions.USER_ACTION_OPENNED);
      this.isVisible = true;
    }
  }

  public hide() {
    if (this.isVisible) {
      this.root.classList.remove(UserActions.USER_ACTION_OPENNED);
      this.element.innerHTML = '';
      this.isVisible = false;
    }
  }

  private render() {
    const element = document.createElement('div');
    element.className = 'coveo-user-actions';
    element.innerHTML = `
      <div class="coveo-summary coveo-accordion">
        <div class="coveo-accordion-header">
          <div class="coveo-accordion-header-title">Session Summary</div>
          <div class="coveo-arrow-down">${arrowDown}</div>
        </div>
        <div class="coveo-accordion-foldable">
          <div class="CoveoDocumentsClicked"></div>
          <div class="CoveoQueries"></div>
        </div>
      </div>
      <div class="coveo-details coveo-accordion">
        <div class="coveo-accordion-header">
          <div class="coveo-accordion-header-title">User Activity</div>
          <div class="coveo-arrow-down">${arrowDown}</div>
        </div>
        <div class="coveo-accordion-foldable">
          <div class="CoveoUserActivity"></div>
        </div>
      </div>`;

    Initialization.automaticallyCreateComponentsInside(element, {
      options: {
        ...this.searchInterface.options.originalOptionsObject,
        Queries: {
          userId: this.options.userId
        },
        DocumentsClicked: {
          userId: this.options.userId
        },
        UserActivity: {
          userId: this.options.userId
        }
      },
      bindings: this.bindings
    });

    element.querySelectorAll('.coveo-accordion').forEach(element => {
      element.querySelector('.coveo-accordion-header').addEventListener('click', () => {
        if (element.classList.contains('coveo-folded')) {
          element.classList.remove('coveo-folded');
        } else {
          element.classList.add('coveo-folded');
        }
      });
    });

    this.element.appendChild(element);
  }
}

Initialization.registerAutoCreateComponent(UserActions);
