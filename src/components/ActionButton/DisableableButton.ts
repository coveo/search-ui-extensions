import { IStatefulActionButtonState, StatefulActionButton } from './StatefulActionButton';

export interface IDisableableButtonOptions {
    disabledIcon: string;
    disabledTooltip: string;
    click?: () => void;
    activate?: () => void;
    deactivate?: () => void;
}

export interface IDisableableButton {
    options: IDisableableButtonOptions;
}

export class DisabledState implements IStatefulActionButtonState {
    static DISABLED_CLASS_NAME = 'coveo-actionbutton-disabled';
    public onStateEntry: (this: StatefulActionButton) => void;
    public onStateExit: (this: StatefulActionButton) => void;
    public click: () => void;
    public icon: string;
    public tooltip: string;

    constructor(disabledButton: IDisableableButton) {
        this.onStateEntry = function () {
            this.element.classList.add(DisabledState.DISABLED_CLASS_NAME);
            this.element.setAttribute('disabled', '');
            if (disabledButton.options.activate) {
                disabledButton.options.activate.apply(disabledButton);
            }
        };
        this.onStateExit = function () {
            this.element.classList.remove(DisabledState.DISABLED_CLASS_NAME);
            this.element.removeAttribute('disabled');
            if (disabledButton.options.deactivate) {
                disabledButton.options.deactivate.apply(disabledButton);
            }
        };
        this.click = () => {};
        this.icon = disabledButton.options.disabledIcon;
        this.tooltip = disabledButton.options.disabledTooltip;
    }
}
