import {
  Component,
  IResponsiveComponent,
  $$,
  Dom,
  ResponsiveComponentsManager,
  IResponsiveComponentOptions,
  ResponsiveDropdownHeader
} from 'coveo-search-ui';
import { UserActions } from './UserActions';

export class ResponsiveUserActions implements IResponsiveComponent {
  private userActions: UserActions;
  private dropdownHeader: ResponsiveDropdownHeader;

  constructor(public root: Dom, public ID: string, _options: IResponsiveComponentOptions) {}

  public static init(root: HTMLElement, component: UserActions) {
    ResponsiveComponentsManager.register(ResponsiveUserActions, $$(root), UserActions.ID, component, {});
  }

  public registerComponent(accept: Component) {
    if ((accept.constructor as typeof Component).ID === UserActions.ID) {
      this.userActions = accept as UserActions;
      this.buildDropdownHeader(this.userActions.options.title);
      return true;
    }
    return false;
  }

  public handleResizeEvent(): void {
    const wrapper = $$(this.root).find(`.${ResponsiveComponentsManager.DROPDOWN_HEADER_WRAPPER_CSS_CLASS}`);
    if (wrapper != null) {
      $$(wrapper).append(this.dropdownHeader.element.el);
    }
  }

  public needDropdownWrapper(): boolean {
    return true;
  }

  private buildDropdownHeader(label: string) {
    // Create a button.
    const button = document.createElement('a');
    const content = document.createElement('p');
    content.innerText = label;
    button.appendChild(content);

    this.dropdownHeader = new ResponsiveDropdownHeader('user-actions', $$(button));
    this.dropdownHeader.element.on('click', () => {
      this.userActions.toggle();
      this.userActions.bindings.usageAnalytics.logCustomEvent({ name: 'openUserActions', type: 'User Actions' }, {}, this.userActions.element);
    });
  }
}
