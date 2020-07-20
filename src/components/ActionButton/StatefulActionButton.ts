import { IResultsComponentBindings } from 'coveo-search-ui';
import { ActionButton, IActionButtonOptions } from './ActionButton';

/**
 * Represent a state that can be used by a StatefulActionButton.
 */
export type IStatefulActionButtonState = IActionButtonOptions & IStatefulActionButtonStateFunctionsAndUtils;

interface IStatefulActionButtonStateFunctionsAndUtils {
    /**
     * Optional argument that could be used for logging purposes in the StatefulActionButton.
     */
    loggingName?: string;
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
    from: IStatefulActionButtonState;
    to: IStatefulActionButtonState;
}

/**
 * The options format for a StatefulActionButton
 */
export interface IStatefulActionButtonOptions {
    /**
     * An array containing all states used by the StatefulActionButton instance.
     * If `switchTo` is called with an unknown state, a warning will be emited
     * and the transition will not occur.
     */
    states: [IStatefulActionButtonState, ...IStatefulActionButtonState[]];
    /**
     * An array containing all the state transitions allowed on the StatefulActionButton instance.
     * If `switchTo` is called with an illegal transitions , a warning will be emited
     * and the transition will not occur.
     */
    allowedTransitions?: IStatefulActionButtonTransition[];
    /**
     * The initial state to be used by the StatefulActionButton instance.
     * If nullish or missing from the states array, a warning will be emited,
     * no ActionButton will be constructed and the element will be hidden
     */
    initalState: IStatefulActionButtonState;
}

/**
 * An action button able to handle multiple states and their transitions.
 */
export class StatefulActionButton {
    static ID = 'StatefulActionButton';
    private currentState: IStatefulActionButtonState;
    private innerActionButton: ActionButton;

    constructor(public element: HTMLElement, public options: IStatefulActionButtonOptions, public bindings?: IResultsComponentBindings) {
        if (!this.areOptionsValid()) {
            return;
        }
        this.currentState = this.options.initalState;
        this.currentState.onStateEntry?.apply(this);
        this.innerActionButton = new ActionButton(element, { ...this.options.initalState, click: this.handleClick.bind(this) }, bindings);
    }

    /**
     * Switch the state of the instance if the state and the transition between the current and new state are allowed.
     * @param state a state to try to switch to
     */
    public switchTo(state: IStatefulActionButtonState) {
        if (!this.isTransitionAllowed(state)) {
            console.warn(`${state.loggingName ?? 'This state'} is not allowed on this StatefulActionButton.`);
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
    private areOptionsValid(): boolean {
        if (!this.options.states?.length) {
            console.warn('The stateful action button cannot render if no states are defined.');
            Coveo.$$(this.element).hide();
            return false;
        }
        if (!this.options.initalState) {
            console.warn('The stateful action button cannot render if the inital states is not defined.');
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

    /**
     * Check if a transition from the current state to @param state is allowed.
     * @param state the destination of the transition
     */
    private isTransitionAllowed(state: IStatefulActionButtonState) {
        return (
            this.options.states.indexOf(state) > -1 &&
            (!this.options.allowedTransitions ||
                this.options.allowedTransitions.some((transition) => transition.from === this.currentState && transition.to === state))
        );
    }

    /**
     * Handle user click.
     */
    private handleClick() {
        this.currentState.click();
    }
}
