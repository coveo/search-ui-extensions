import { ComponentOptions, IResultsComponentBindings, Component, Initialization } from 'coveo-search-ui';
import { ToggleActivatedState, ToggleDeactivatedState, IToggleableButton, IToggleableButtonOptions } from './ToggleableButton';
import { StatefulActionButtonState, StatefulActionButton } from './StatefulActionButton';

export class ToggleActionButton extends Component implements IToggleableButton {
    static ID = 'ToggleActionButton';
    static ACTIVATED_CLASS_NAME = 'coveo-toggleactionbutton-activated';

    static options: IToggleableButtonOptions = {
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

    constructor(public element: HTMLElement, public options: IToggleableButtonOptions, public bindings?: IResultsComponentBindings) {
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

    public onClick(): void {
        this.setActivated(!this.isActivated());

        if (this.options.click) {
            this.options.click();
        }
    }

    private createInnerButton(bindings?: IResultsComponentBindings): void {
        this.deactivatedState = new ToggleDeactivatedState(this);
        this.activatedState = new ToggleActivatedState(this);

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
