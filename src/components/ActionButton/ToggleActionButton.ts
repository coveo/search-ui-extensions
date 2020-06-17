import { ComponentOptions, IResultsComponentBindings, Component, Initialization } from 'coveo-search-ui';
import { ActionButton } from './ActionButton';

export interface IToggleActionButtonOptions {
    activatedIcon: string;
    activatedTooltip: string;
    icon: string;
    tooltip: string;
    click?: () => void;
    activate?: () => void;
    deactivate?: () => void;
}

export class ToggleActionButton extends Component {
    static ID = 'ToggleActionButton';

    static options: IToggleActionButtonOptions = {
        /**
         * Specifies the button icon when the button is activated.
         *
         * Default is the empty string.
         *
         * For example, with this SVG markup:
         *
         * ```xml
         * <svg width="1em" height="1em">...</svg>
         * ```
         *
         * The attribute would be set like this:
         *
         * ```html
         * <button class='CoveoToggleActionButton' data-activated-icon='&lt;svg width=&quot;1em&quot; height=&quot;1em&quot;&gt;...&lt;/svg&gt;'></button>
         * ```
         */
        activatedIcon: ComponentOptions.buildStringOption(),

        /**
         * Specifies the button tooltip when the button is activated.
         *
         * Default is the empty string.
         *
         * ```html
         * <button class='CoveoToggleActionButton' data-activated-tooltip='My activated button tooltip'></button>
         * ```
         */
        activatedTooltip: ComponentOptions.buildStringOption(),

        /**
         * Specifies the button SVG icon.
         * Note: The SVG markup has to be HTML encoded when set using the HTML attributes.
         *
         * Default is the empty string.
         *
         * For example, with this SVG markup:
         *
         * ```xml
         * <svg width="1em" height="1em">...</svg>
         * ```
         *
         * The attribute would be set like this:
         *
         * ```html
         * <button class='CoveoToggleActionButton' data-icon='&lt;svg width=&quot;1em&quot; height=&quot;1em&quot;&gt;...&lt;/svg&gt;'></button>
         * ```
         */
        icon: ComponentOptions.buildStringOption(),

        /**
         * Specifies the button tooltip text.
         *
         * Default is the empty string.
         *
         * ```html
         * <button class='CoveoToggleActionButton' data-tooltip='My button tooltip'></button>
         * ```
         */
        tooltip: ComponentOptions.buildStringOption(),

        click: ComponentOptions.buildCustomOption(s => null),

        activate: ComponentOptions.buildCustomOption(s => null),

        deactivate: ComponentOptions.buildCustomOption(s => null)
    };

    private static ACTIVATED_CLASS_NAME = 'coveo-toggleactionbutton-activated';

    private isActivated: boolean = false;
    private innerButton: ActionButton;

    constructor(public element: HTMLElement, public options: IToggleActionButtonOptions, public bindings?: IResultsComponentBindings) {
        super(element, ToggleActionButton.ID, bindings);
        this.options = ComponentOptions.initComponentOptions(element, ToggleActionButton, options);

        this.createInnerButton(bindings);
    }

    private createInnerButton(bindings?: IResultsComponentBindings): void {
        this.innerButton = new ActionButton(
            this.element,
            {
                icon: this.options.icon,
                tooltip: this.options.tooltip,
                click: () => this.onClick()
            },
            bindings
        );

        this.updateButton();
    }

    protected onClick(): void {
        this.isActivated = !this.isActivated;
        this.updateButton();

        if (this.options.click) {
            this.options.click();
        }
        if (this.isActivated && this.options.activate) {
            this.options.activate();
        }
        if (!this.isActivated && this.options.deactivate) {
            this.options.deactivate();
        }
    }

    private updateButton() {
        if (this.isActivated) {
            this.element.classList.add(ToggleActionButton.ACTIVATED_CLASS_NAME);
            this.element.setAttribute('aria-pressed', 'true');

            this.innerButton.updateIcon(this.options.activatedIcon);
            this.innerButton.updateTooltip(this.options.activatedTooltip);
        } else {
            this.element.classList.remove(ToggleActionButton.ACTIVATED_CLASS_NAME);
            this.element.setAttribute('aria-pressed', 'false');

            this.innerButton.updateIcon(this.options.icon);
            this.innerButton.updateTooltip(this.options.tooltip);
        }
    }
}

Initialization.registerAutoCreateComponent(ToggleActionButton);
