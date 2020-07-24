import { StatefulActionButton, IStatefulActionButtonOptionsWithIcon } from './StatefulActionButton';

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

export class ToggleUnactivatedState implements IStatefulActionButtonOptionsWithIcon {
    public readonly name = 'ToggleUnactivatedState';
    public readonly icon: string;
    public readonly tooltip: string;
    public readonly click: { (): void; (): void; (): void };
    constructor(toggleableButton: IToggleableButton) {
        this.icon = toggleableButton.options.activateIcon;
        this.tooltip = toggleableButton.options.activateTooltip;
        this.click = () => toggleableButton.onClick();
    }
}

export class ToggleActivatedState implements IStatefulActionButtonOptionsWithIcon {
    static ACTIVATED_CLASS_NAME = 'coveo-toggleactionbutton-activated';
    public readonly name = 'ToggleActivatedState';
    public readonly onStateEntry: (this: StatefulActionButton) => void;
    public readonly onStateExit: (this: StatefulActionButton) => void;
    public readonly click: () => void;
    public readonly icon: string;
    public readonly tooltip: string;
    constructor(toggleableButton: IToggleableButton) {
        this.onStateEntry = function () {
            this.element.classList.add(ToggleActivatedState.ACTIVATED_CLASS_NAME);
            this.element.setAttribute('aria-pressed', 'true');
            toggleableButton.options.activate?.apply(toggleableButton);
        };
        this.onStateExit = function () {
            this.element.classList.remove(ToggleActivatedState.ACTIVATED_CLASS_NAME);
            this.element.setAttribute('aria-pressed', 'false');
            toggleableButton.options.deactivate?.apply(toggleableButton);
        };
        this.click = () => toggleableButton.onClick();
        this.icon = toggleableButton.options.deactivateIcon;
        this.tooltip = toggleableButton.options.deactivateTooltip;
    }
}
