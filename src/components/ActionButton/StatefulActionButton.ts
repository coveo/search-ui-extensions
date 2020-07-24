import { IResultsComponentBindings } from 'coveo-search-ui';
import { ActionButton, ActionButtonOptions, IActionButtonOptionsWithTitle, IActionButtonOptionsWithIcon } from './ActionButton';

/**
 * Represent a state that can be used by a StatefulActionButton.
 */
export type StatefulActionButtonState = ActionButtonOptions & IStateOptions;
export interface IStatefulActionButtonOptionsWithTitle extends IActionButtonOptionsWithTitle, IStateOptions {}
export interface IStatefulActionButtonOptionsWithIcon extends IActionButtonOptionsWithIcon, IStateOptions {}

export interface IStateOptions {
    /**
     * The name of the state. Used by StatefulActionButton for logging.
     */
    name: string;
    /**
     * Called when this state is set as the current state.
     * Called after the onStateExit of the previous state if any.
     */
    onStateEntry?: (this: StatefulActionButton) => void;
    /**
     * Called when this state has been set as the current state and another is about to get set.
     * Called before the onStateEntry of the next state if any.
     */
    onStateExit?: (this: StatefulActionButton) => void;
}

/**
 * Represent a transition from one `IStatefulActionButtonState` to another.
 */
export interface IStatefulActionButtonTransition {
    from: StatefulActionButtonState;
    to: StatefulActionButtonState;
}

/**
 * The options format for a StatefulActionButton
 */
export interface IStatefulActionButtonOptions {
    /**
     * An array containing all states used by the StatefulActionButton instance.
     * If `switchTo` is called with an unknown state, a warning will be emitted
     * and the transition will not occur.
     */
    states: [StatefulActionButtonState, ...StatefulActionButtonState[]];
    /**
     * An array containing all the state transitions allowed on the StatefulActionButton instance.
     * If `switchTo` is called with an illegal transitions , a warning will be emitted
     * and the transition will not occur.
     */
    allowedTransitions?: IStatefulActionButtonTransition[];
    /**
     * The initial state to be used by the StatefulActionButton instance.
     * If nullish or missing from the states array, a warning will be emitted,
     * no ActionButton will be constructed and the element will be hidden
     */
    initialState: StatefulActionButtonState;
}

/**
 * An action button able to handle multiple states and their transitions.
 */
export class StatefulActionButton {
    static ID = 'StatefulActionButton';
    private currentState: StatefulActionButtonState;
    private innerActionButton: ActionButton;

    constructor(public element: HTMLElement, public options: IStatefulActionButtonOptions, public bindings?: IResultsComponentBindings) {
        const optionsValidity = this.checkOptionsValidity();
        if (!optionsValidity.areValid) {
            console.warn(`Cannot render the stateful action button because options are invalid.\n\t${optionsValidity.errorMessage}`);
            return;
        }
        this.currentState = this.options.initialState;
        this.currentState.onStateEntry?.apply(this);
        this.innerActionButton = new ActionButton(element, { ...this.options.initialState, click: this.handleClick.bind(this) }, bindings);
    }

    /**
     * Switch the state of the instance if the state and the transition between the current and new state are allowed.
     * @param state a state to try to switch to
     */
    public switchTo(state: StatefulActionButtonState) {
        if (this.options.states.indexOf(state) === -1) {
            console.warn(
                `State '${state.name}' does not exist on this StatefulActionButton\nEnsure to use the object references used at the instantiation.`
            );
            return;
        }
        if (!this.isTransitionAllowed(state)) {
            console.warn(
                `Transition from State '${this.currentState.name}' to State '${state.name}' is not allowed on this StatefulActionButton.\nEnsure to use the object references used at the instantiation.`
            );
            return;
        }
        this.currentState.onStateExit?.apply(this);
        state.onStateEntry?.apply(this);
        this.innerActionButton.updateIcon(state.icon);
        this.innerActionButton.updateTooltip(state.tooltip);
        this.currentState = state;
    }

    /**
     * Return the current state of the instance.
     */
    public getCurrentState() {
        return this.currentState;
    }

    /**
     * Check if the options given to the constructor are valid.
     * If not, it will also display the appropriate warning.
     */
    private checkOptionsValidity(): { areValid: boolean; errorMessage?: string } {
        if (!this.options.states?.length) {
            return { areValid: false, errorMessage: 'States is not defined or empty.' };
        }
        if (!this.options.initialState) {
            return { areValid: false, errorMessage: 'InitialState is not defined.' };
        }
        if (this.options.states.indexOf(this.options.initialState) < 0) {
            return { areValid: false, errorMessage: 'InitialState is not in the list of state.' };
        }
        return !this.options.allowedTransitions ? { areValid: true } : this.areTransitionsValid();
    }

    private areTransitionsValid(): { areValid: boolean; errorMessage?: string } {
        for (let index = 0; index < this.options.allowedTransitions.length; index++) {
            const transition = this.options.allowedTransitions[index];
            if (this.options.states.indexOf(transition.from) === -1) {
                return { areValid: false, errorMessage: this.generateInvalidTransitionMessage(index, true) };
            }
            if (this.options.states.indexOf(transition.to) === -1) {
                return { areValid: false, errorMessage: this.generateInvalidTransitionMessage(index, false) };
            }
        }
        return { areValid: true };
    }

    private generateInvalidTransitionMessage(transitionNumber: number, isOrigin: boolean) {
        return `${
            isOrigin ? 'Origin' : 'Destination'
        } of Transition #${transitionNumber} is not in the list of states. Ensure to use the same object reference as in the options.states.`;
    }

    /**
     * Check if a transition from the current state to @param state is allowed.
     * @param state the destination of the transition
     */
    private isTransitionAllowed(state: StatefulActionButtonState) {
        if (!this.options.allowedTransitions) {
            return true;
        }
        return this.options.allowedTransitions.some((transition) => transition.from === this.currentState && transition.to === state);
    }

    /**
     * Handle user click.
     */
    private handleClick() {
        this.currentState.click();
    }
}
