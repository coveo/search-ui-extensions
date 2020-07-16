import { IStatefulActionButtonState, StatefulActionButton } from './StatefulActionButton';

export interface IToggleableButtonOptions {
    activateIcon: string;
    activateTooltip: string;
    deactivateIcon: string;
    deactivateTooltip: string;
    click?: () => void;
    activate?: () => void;
    deactivate?: () => void;
}

export interface IToggleableButton {
    options: IToggleableButtonOptions;
    onClick: () => void;
}

export class ToggleDeactivatedState implements IStatefulActionButtonState {
    public icon: string;
    public tooltip: string;
    public click: { (): void; (): void; (): void };
    constructor(toggleableButton: IToggleableButton) {
        this.icon = toggleableButton.options.activateIcon;
        this.tooltip = toggleableButton.options.activateTooltip;
        this.click = () => toggleableButton.onClick();
    }
}

export class ToggleActivatedState implements IStatefulActionButtonState {
    static ACTIVATED_CLASS_NAME = 'coveo-toggleactionbutton-activated';
    public onStateEntry: (this: StatefulActionButton) => void;
    public onStateExit: (this: StatefulActionButton) => void;
    public click: () => void;
    public icon: string;
    public tooltip: string;

    constructor(toggleableButton: IToggleableButton) {
        this.onStateEntry = function () {
            this.element.classList.add(ToggleActivatedState.ACTIVATED_CLASS_NAME);
            this.element.setAttribute('aria-pressed', 'true');
            if (toggleableButton.options.activate) {
                toggleableButton.options.activate.apply(toggleableButton);
            }
        };
        this.onStateExit = function () {
            this.element.classList.remove(ToggleActivatedState.ACTIVATED_CLASS_NAME);
            this.element.setAttribute('aria-pressed', 'false');
            if (toggleableButton.options.deactivate) {
                toggleableButton.options.deactivate.apply(toggleableButton);
            }
        };
        this.click = () => toggleableButton.onClick();
        this.icon = toggleableButton.options.deactivateIcon;
        this.tooltip = toggleableButton.options.deactivateTooltip;
    }
}
