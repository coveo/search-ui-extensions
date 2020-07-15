import { IResultsComponentBindings } from 'coveo-search-ui';
import { ActionButton, IActionButtonOptions } from './ActionButton';

export interface IStatefulActionButtonState extends IActionButtonOptions {
    onStateEntry?: (this: StatefulActionButton) => void;
    onStateExit?: (this: StatefulActionButton) => void;
}

export interface IStatefulActionButtonTransition {
    from: IStatefulActionButtonState;
    to: IStatefulActionButtonState;
}

export interface IStatefulActionButtonOptions {
    states: IStatefulActionButtonState[];
    allowedTransitions?: IStatefulActionButtonTransition[];
    initalState: IStatefulActionButtonState;
}

export class StatefulActionButton {
    static ID = 'StatefulActionButton';
    private currentState: IStatefulActionButtonState;
    private innerActionButton: ActionButton;

    constructor(public element: HTMLElement, public options: IStatefulActionButtonOptions, public bindings?: IResultsComponentBindings) {
        if (!this.areOptionsValid()) {
            return;
        }
        this.currentState = this.options.initalState;
        this.innerActionButton = new ActionButton(element, { ...this.options.initalState, click: this.handleClick.bind(this) }, bindings);
    }

    private handleClick() {
        this.currentState.click();
    }

    public switchTo(state: IStatefulActionButtonState) {
        if (!this.isTransitionAllowed(state)) {
            return;
        }
        this.currentState.onStateExit?.apply(this);
        state.onStateEntry?.apply(this);
        this.innerActionButton.updateIcon(state.icon);
        this.innerActionButton.updateTooltip(state.tooltip);
        this.currentState = state;
    }

    public getCurrentState() {
        return this.currentState;
    }

    private isTransitionAllowed(state: IStatefulActionButtonState) {
        return (
            !this.options.allowedTransitions ||
            this.options.allowedTransitions.some((transition) => transition.from === this.currentState && transition.to === state)
        );
    }

    private areOptionsValid() {
        if (!this.options.states?.length) {
            console.warn('The stateful action button cannot render if no states are defined.');
            Coveo.$$(this.element).hide();
            return false;
        }
        if (this.options.states.indexOf(this.options.initalState) < 0) {
            console.warn('The stateful action button cannot render if the initial state is not in the list of states.');
            Coveo.$$(this.element).hide();
            return false;
        }
        return true;
    }
}
