import { StatefulActionButton, IStatefulActionButtonOptionsWithIcon } from './StatefulActionButton';

export interface IDisableableButtonOptions {
    disabledIcon: string;
    disabledTooltip: string;
}

export interface IDisableableButton {
    options: IDisableableButtonOptions;
}

export class DisabledState implements IStatefulActionButtonOptionsWithIcon {
    static DISABLED_CLASS_NAME = 'coveo-actionbutton-disabled';
    public readonly onStateEntry: (this: StatefulActionButton) => void;
    public readonly onStateExit: (this: StatefulActionButton) => void;
    public readonly click: () => void;
    public readonly icon: string;
    public readonly tooltip: string;
    public readonly loggingName = 'DisabledState';

    constructor(disabledButton: IDisableableButton) {
        this.onStateEntry = function () {
            this.element.classList.add(DisabledState.DISABLED_CLASS_NAME);
            this.element.setAttribute('disabled', '');
        };
        this.onStateExit = function () {
            this.element.classList.remove(DisabledState.DISABLED_CLASS_NAME);
            this.element.removeAttribute('disabled');
        };
        this.click = () => {};
        this.icon = disabledButton.options.disabledIcon;
        this.tooltip = disabledButton.options.disabledTooltip;
    }
}
