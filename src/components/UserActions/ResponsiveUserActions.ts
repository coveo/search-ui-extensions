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

/**
 * Handle the responsive button creation and positionning.
 */
export class ResponsiveUserActions implements IResponsiveComponent {
    private userActions: UserActions;
    private dropdownHeader: ResponsiveDropdownHeader;

    /**
     * Create a **ResponsiveUserActions** instance.
     *
     * @param root The root of the interface.
     * @param ID Identifier of the **ResponsiveUserActions**.
     * @param _options _unused parameter_.
     */
    constructor(public root: Dom, public ID: string, _options: IResponsiveComponentOptions) {}

    /**
     * Register the **component** to the **ResponsiveComponentsManager**.
     *
     * @param root The root of the interface.
     * @param component The component to register as a responsive component.
     */
    public static init(root: HTMLElement, component: UserActions) {
        ResponsiveComponentsManager.register(ResponsiveUserActions, $$(root), UserActions.ID, component, {});
    }

    /**
     * Register the user action component as a responsive component.
     *
     * @param component The component to register as a responsive component.
     */
    public registerComponent(component: Component) {
        if (!this.userActions && (component.constructor as typeof Component).ID === UserActions.ID) {
            this.userActions = component as UserActions;
            this.buildDropdownHeader(this.userActions.options.buttonLabel);
            return true;
        }
        return false;
    }

    /**
     * On resize, will place the user actions button in the Dropdown Header Wrapper Section.
     */
    public handleResizeEvent(): void {
        const wrapper = $$(this.root).find(`.${ResponsiveComponentsManager.DROPDOWN_HEADER_WRAPPER_CSS_CLASS}`);
        if (wrapper != null) {
            $$(wrapper).append(this.dropdownHeader.element.el);
        }
    }

    /**
     * Always return true because the component always need a button.
     */
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
        });
    }
}
