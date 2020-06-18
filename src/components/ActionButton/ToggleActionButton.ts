import { ComponentOptions, IResultsComponentBindings, Component, Initialization } from 'coveo-search-ui';
import { ActionButton } from './ActionButton';

export interface IToggleActionButtonOptions {
    activatedIcon: string;
    activatedTooltip: string;
    deactivatedIcon: string;
    deactivatedTooltip: string;
    click?: () => void;
    activate?: () => void;
    deactivate?: () => void;
}

export class ToggleActionButton extends Component {
    static ID = 'ToggleActionButton';
    static ACTIVATED_CLASS_NAME = 'coveo-toggleactionbutton-activated';

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
         * Specifies the button SVG icon when the button is deactivated.
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
         * <button class='CoveoToggleActionButton' data-deactivated-icon='&lt;svg width=&quot;1em&quot; height=&quot;1em&quot;&gt;...&lt;/svg&gt;'></button>
         * ```
         */
        deactivatedIcon: ComponentOptions.buildStringOption(),

        /**
         * Specifies the button tooltip text when the button is deactivated.
         *
         * Default is the empty string.
         *
         * ```html
         * <button class='CoveoToggleActionButton' data-deactivated-tooltip='My button tooltip'></button>
         * ```
         */
        deactivatedTooltip: ComponentOptions.buildStringOption(),

        /**
         * Specifies the handler called when the button is clicked.
         *
         * Default is `null`.
         *
         * This option is set in JavaScript when initializing the component.
         */
        click: ComponentOptions.buildCustomOption(s => null),

        /**
         * Specifies the handler called when the button is activated.
         *
         * Default is `null`.
         *
         * This option is set in JavaScript when initializing the component.
         */
        activate: ComponentOptions.buildCustomOption(s => null),

        /**
         * Specifies the handler called when the button is deactivated.
         *
         * Default is `null`.
         *
         * This option is set in JavaScript when initializing the component.
         */
        deactivate: ComponentOptions.buildCustomOption(s => null)
    };

    private _isActivated: boolean = false;
    private innerActionButton: ActionButton;

    constructor(public element: HTMLElement, public options: IToggleActionButtonOptions, public bindings?: IResultsComponentBindings) {
        super(element, ToggleActionButton.ID, bindings);
        this.options = ComponentOptions.initComponentOptions(element, ToggleActionButton, options);

        this.createInnerButton(bindings);
    }

    /**
     * Indicates whether the toggle button is in the activated state.
     */
    public isActivated(): boolean {
        return this._isActivated;
    }

    /**
     * Sets the toggle button to the specified state.
     * @param activated Whether the button is activated.
     */
    public setActivated(activated: boolean): void {
        if (activated !== this.isActivated()) {
            this._isActivated = activated;
            this.updateButton();

            if (this._isActivated && this.options.activate) {
                this.options.activate();
            }
            if (!this._isActivated && this.options.deactivate) {
                this.options.deactivate();
            }
        }
    }

    protected onClick(): void {
        this.setActivated(!this.isActivated());

        if (this.options.click) {
            this.options.click();
        }
    }

    private createInnerButton(bindings?: IResultsComponentBindings): void {
        this.innerActionButton = new ActionButton(
            this.element,
            {
                icon: this.options.deactivatedIcon,
                tooltip: this.options.deactivatedTooltip,
                click: () => this.onClick()
            },
            bindings
        );

        this.updateButton();
    }

    private updateButton() {
        if (this._isActivated) {
            this.element.classList.add(ToggleActionButton.ACTIVATED_CLASS_NAME);
            this.element.setAttribute('aria-pressed', 'true');

            this.innerActionButton.updateIcon(this.options.activatedIcon);
            this.innerActionButton.updateTooltip(this.options.activatedTooltip);
        } else {
            this.element.classList.remove(ToggleActionButton.ACTIVATED_CLASS_NAME);
            this.element.setAttribute('aria-pressed', 'false');

            this.innerActionButton.updateIcon(this.options.deactivatedIcon);
            this.innerActionButton.updateTooltip(this.options.deactivatedTooltip);
        }
    }
}

Initialization.registerAutoCreateComponent(ToggleActionButton);
