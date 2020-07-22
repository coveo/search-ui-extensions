import { ComponentOptions, IResultsComponentBindings, Component, Initialization } from 'coveo-search-ui';
import { StatefulActionButtonState, StatefulActionButton } from './StatefulActionButton';

export interface IToggleActionButtonOptions {
    activateIcon: string;
    activateTooltip: string;
    deactivateIcon: string;
    deactivateTooltip: string;
    click?: () => void;
    activate?: () => void;
    deactivate?: () => void;
}

export class ToggleActionButton extends Component {
    /**
     * Create the deactivated state for a given ToggleActionButton
     * @param button {ToggleActionButton}
     */
    static generateDeactivatedStateInstance(button: ToggleActionButton): StatefulActionButtonState {
        return {
            name: 'DeactivatedState',
            icon: button.options.activateIcon,
            tooltip: button.options.activateTooltip,
            click: () => button.onClick(),
        };
    }

    /**
     * Create the activated state for a given ToggleActionButton
     * @param button {ToggleActionButton}
     */
    static generateActivatedStateInstance(button: ToggleActionButton): StatefulActionButtonState {
        return {
            onStateEntry: function () {
                this.element.classList.add(ToggleActionButton.ACTIVATED_CLASS_NAME);
                this.element.setAttribute('aria-pressed', 'true');
                if (button.options.activate) {
                    button.options.activate.apply(button);
                }
            },
            onStateExit: function () {
                this.element.classList.remove(ToggleActionButton.ACTIVATED_CLASS_NAME);
                this.element.setAttribute('aria-pressed', 'false');
                if (button.options.deactivate) {
                    button.options.deactivate.apply(this);
                }
            },
            name: 'ActivatedState',
            click: () => button.onClick(),
            icon: button.options.deactivateIcon,
            tooltip: button.options.deactivateTooltip,
        };
    }

    static ID = 'ToggleActionButton';
    static ACTIVATED_CLASS_NAME = 'coveo-toggleactionbutton-activated';

    static options: IToggleActionButtonOptions = {
        /**
         * Specifies the button SVG icon displayed to activate the button.
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
         * <button class='CoveoToggleActionButton' data-activate-icon='&lt;svg width=&quot;1em&quot; height=&quot;1em&quot;&gt;...&lt;/svg&gt;'></button>
         * ```
         */
        activateIcon: ComponentOptions.buildStringOption({ alias: 'deactivatedIcon' }),

        /**
         * Specifies the button tooltip text displayed to activate the button.
         *
         * Default is the empty string.
         *
         * ```html
         * <button class='CoveoToggleActionButton' data-activate-tooltip='Activate the feature'></button>
         * ```
         */
        activateTooltip: ComponentOptions.buildStringOption({ alias: 'deactivatedTooltip' }),

        /**
         * Specifies the button icon displayed to deactivate the button.
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
         * <button class='CoveoToggleActionButton' data-deactivate-icon='&lt;svg width=&quot;1em&quot; height=&quot;1em&quot;&gt;...&lt;/svg&gt;'></button>
         * ```
         */
        deactivateIcon: ComponentOptions.buildStringOption({ alias: 'activatedIcon' }),

        /**
         * Specifies the button tooltip displayed to deactivate the button.
         *
         * Default is the empty string.
         *
         * ```html
         * <button class='CoveoToggleActionButton' data-deactivate-tooltip='Deactivate the feature'></button>
         * ```
         */
        deactivateTooltip: ComponentOptions.buildStringOption({ alias: 'activatedTooltip' }),

        /**
         * Specifies the handler called when the button is clicked.
         *
         * Default is `null`.
         *
         * This option is set in JavaScript when initializing the component.
         */
        click: ComponentOptions.buildCustomOption((s) => null),

        /**
         * Specifies the handler called when the button is activated.
         *
         * Default is `null`.
         *
         * This option is set in JavaScript when initializing the component.
         */
        activate: ComponentOptions.buildCustomOption((s) => null),

        /**
         * Specifies the handler called when the button is deactivated.
         *
         * Default is `null`.
         *
         * This option is set in JavaScript when initializing the component.
         */
        deactivate: ComponentOptions.buildCustomOption((s) => null),
    };

    private innerStatefulActionButton: StatefulActionButton;
    private activatedState: StatefulActionButtonState;
    private deactivatedState: StatefulActionButtonState;

    constructor(public element: HTMLElement, public options: IToggleActionButtonOptions, public bindings?: IResultsComponentBindings) {
        super(element, ToggleActionButton.ID, bindings);
        this.options = ComponentOptions.initComponentOptions(element, ToggleActionButton, options);

        this.createInnerButton(bindings);
    }

    /**
     * Indicates whether the toggle button is in the activated state.
     */
    public isActivated(): boolean {
        return this.innerStatefulActionButton.getCurrentState() === this.activatedState;
    }

    /**
     * Sets the toggle button to the specified state.
     * @param activated Whether the button is activated.
     */
    public setActivated(activated: boolean): void {
        if (activated !== this.isActivated()) {
            this.innerStatefulActionButton.switchTo(activated ? this.activatedState : this.deactivatedState);
        }
    }

    protected onClick(): void {
        this.setActivated(!this.isActivated());

        if (this.options.click) {
            this.options.click();
        }
    }

    private createInnerButton(bindings?: IResultsComponentBindings): void {
        this.activatedState = ToggleActionButton.generateActivatedStateInstance(this);
        this.deactivatedState = ToggleActionButton.generateDeactivatedStateInstance(this);

        this.innerStatefulActionButton = new StatefulActionButton(
            this.element,
            {
                initialState: this.deactivatedState,
                states: [this.deactivatedState, this.activatedState],
                allowedTransitions: [
                    { from: this.deactivatedState, to: this.activatedState },
                    { from: this.activatedState, to: this.deactivatedState },
                ],
            },
            bindings
        );
    }
}

Initialization.registerAutoCreateComponent(ToggleActionButton);
