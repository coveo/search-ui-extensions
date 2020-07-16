import { ComponentOptions, IResultsComponentBindings, Component, Initialization } from 'coveo-search-ui';
import { StatefulActionButton } from './StatefulActionButton';
import {
    ToggleActivatedState as ActivatedState,
    ToggleDeactivatedState as DeactivatedState,
    IToggleableButton,
    IToggleableButtonOptions,
} from './ToggleableButton';
import { IDisableableButton, IDisableableButtonOptions, DisabledState } from './DisableableButton';
import { ToggleActionButton } from './ToggleActionButton';

export interface IDisableableToggleActionButtonOptions extends IToggleableButtonOptions, IDisableableButtonOptions {}

export class DisableableToggleActionButton extends Component implements IToggleableButton, IDisableableButton {
    static ID = 'DisableableToggleActionButton';
    static ACTIVATED_CLASS_NAME = 'coveo-toggleactionbutton-activated';

    private innerStatefulActionButton: StatefulActionButton;
    private activatedState: ActivatedState;
    private deactivatedState: DeactivatedState;
    private disabledState: DisabledState;

    static options: IDisableableToggleActionButtonOptions = {
        ...ToggleActionButton.options,
        disabledTooltip: ComponentOptions.buildStringOption(),
        disabledIcon: ComponentOptions.buildStringOption(),
    };

    constructor(public element: HTMLElement, public options: IDisableableToggleActionButtonOptions, public bindings?: IResultsComponentBindings) {
        super(element, DisableableToggleActionButton.ID, bindings);
        this.options = ComponentOptions.initComponentOptions(element, DisableableToggleActionButton, options);

        this.createInnerButton(bindings);
    }

    /**
     * Indicates whether the toggle button is in the activated state.
     */
    public isActivated(): boolean {
        return this.innerStatefulActionButton.getCurrentState() === this.activatedState;
    }

    /**
     * Indicates whether the disableable toggle button is in the disable state.
     */
    public isDisabled(): boolean {
        return this.innerStatefulActionButton.getCurrentState() === this.disabledState;
    }

    /**
     * Sets the toggle button to the specified state.
     * @param activated Whether the button is activated.
     */
    public setActivated(activated: boolean): void {
        if (this.isDisabled() && !activated) {
            this.innerStatefulActionButton.switchTo(this.deactivatedState);
        }
        if (!this.isDisabled() && activated !== this.isActivated()) {
            this.innerStatefulActionButton.switchTo(activated ? this.activatedState : this.deactivatedState);
        }
    }

    public setEnabled(enabled: boolean): void {
        if (enabled) {
            this.enable();
        } else {
            this.disable();
        }
    }

    public disable(): void {
        if (this.isDisabled()) {
            return;
        }
        if (this.isActivated()) {
            this.innerStatefulActionButton.switchTo(this.deactivatedState);
        }
        this.innerStatefulActionButton.switchTo(this.disabledState);
    }

    public enable(): void {
        if (this.isDisabled()) {
            this.innerStatefulActionButton.switchTo(this.deactivatedState);
        }
    }

    public onClick(): void {
        if (this.isDisabled()) {
            return;
        }
        this.setActivated(!this.isActivated());

        if (this.options.click) {
            this.options.click();
        }
    }

    private createInnerButton(bindings?: IResultsComponentBindings): void {
        this.deactivatedState = new DeactivatedState(this);
        this.disabledState = new DisabledState(this);
        this.activatedState = new ActivatedState(this);

        this.innerStatefulActionButton = new StatefulActionButton(
            this.element,
            {
                initalState: this.deactivatedState,
                states: [this.deactivatedState, this.activatedState, this.disabledState],
                allowedTransitions: [
                    { from: this.deactivatedState, to: this.disabledState },
                    { from: this.disabledState, to: this.deactivatedState },
                    { from: this.deactivatedState, to: this.activatedState },
                    { from: this.activatedState, to: this.deactivatedState },
                ],
            },
            bindings
        );
    }
}

Initialization.registerAutoCreateComponent(ToggleActionButton);
