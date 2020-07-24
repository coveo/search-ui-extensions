import { StatefulActionButton, StatefulActionButtonState } from '../../../src/components/ActionButton/StatefulActionButton';
import { createSandbox, SinonSpy, SinonSandbox } from 'sinon';

describe('StatefulActionButton', () => {
    let testSubject: StatefulActionButton;
    let sandbox: SinonSandbox;
    let spyConsoleWarn: SinonSpy;
    const createSpiedState: (stateName: string) => [StatefulActionButtonState, SinonSpy, SinonSpy] = (stateName: string) => {
        const stateEntrySpy = sandbox.spy();
        const stateExitSpy = sandbox.spy();
        const state: StatefulActionButtonState = {
            name: stateName,
            icon: 'foo',
            title: 'bar',
            onStateEntry: stateEntrySpy,
            onStateExit: stateExitSpy,
        };

        return [state, stateEntrySpy, stateExitSpy];
    };

    beforeAll(() => {
        sandbox = createSandbox();
    });

    beforeEach(() => {
        spyConsoleWarn = sandbox.spy(window.console, 'warn');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        let initialState: StatefulActionButtonState;
        let initialOnEntrySpy: SinonSpy;

        beforeEach(() => {
            [initialState, initialOnEntrySpy] = createSpiedState('initialState');
        });

        [
            {
                describe: 'if states is not defined',
                beforeEach: () => {
                    testSubject = new StatefulActionButton(document.createElement('div'), { states: undefined, initialState: initialState });
                },
                expectedWarningMessage: 'Cannot render the stateful action button because options are invalid.\n\tStates is not defined or empty.',
            },
            {
                describe: 'if states is empty',
                beforeEach: () => {
                    testSubject = new StatefulActionButton(document.createElement('div'), { states: [] as any, initialState: initialState });
                },
                expectedWarningMessage: 'Cannot render the stateful action button because options are invalid.\n\tStates is not defined or empty.',
            },
            {
                describe: 'if initialState is not defined',
                beforeEach: () => {
                    testSubject = new StatefulActionButton(document.createElement('div'), { states: [initialState], initialState: undefined });
                },
                expectedWarningMessage: 'Cannot render the stateful action button because options are invalid.\n\tInitialState is not defined.',
            },
            {
                describe: 'if states does not include initialState',
                beforeEach: () => {
                    testSubject = new StatefulActionButton(document.createElement('div'), {
                        states: [createSpiedState('notInitialState')[0]],
                        initialState: initialState,
                    });
                },
                expectedWarningMessage:
                    'Cannot render the stateful action button because options are invalid.\n\tInitialState is not in the list of state.',
            },
            {
                describe: 'if an allowedTransitions contains a transition with a origin state not included in options.state',
                beforeEach: () => {
                    testSubject = new StatefulActionButton(document.createElement('div'), {
                        states: [initialState],
                        initialState: initialState,
                        allowedTransitions: [{ from: createSpiedState('someState')[0], to: initialState }],
                    });
                },
                expectedWarningMessage:
                    'Cannot render the stateful action button because options are invalid.\n\tOrigin of Transition #0 is not in the list of states. Ensure to use the same object reference as in the options.states.',
            },
            {
                describe: 'if an allowedTransitions contains a transition with a destination state not included in options.state',
                beforeEach: () => {
                    testSubject = new StatefulActionButton(document.createElement('div'), {
                        states: [initialState],
                        initialState: initialState,
                        allowedTransitions: [{ from: initialState, to: createSpiedState('someState')[0] }],
                    });
                },
                expectedWarningMessage:
                    'Cannot render the stateful action button because options are invalid.\n\tDestination of Transition #0 is not in the list of states. Ensure to use the same object reference as in the options.states.',
            },
        ].forEach((testCase) => {
            describe(testCase.describe, () => {
                beforeEach(testCase.beforeEach);

                it(`should hide the button, log an appropriate warning and not complete the initialization`, () => {
                    expect(spyConsoleWarn.calledWithExactly(testCase.expectedWarningMessage)).toBeTrue();
                    expect(testSubject.getCurrentState()).toBeUndefined();
                    expect(initialOnEntrySpy.called).toBeFalse();
                });
            });
        });

        describe('if the options are valid', () => {
            beforeEach(() => {
                [initialState, initialOnEntrySpy] = createSpiedState('initialState');
                testSubject = new StatefulActionButton(document.createElement('div'), { states: [initialState], initialState: initialState });
            });

            it('should complete the initialization', () => {
                expect(spyConsoleWarn.called).toBeFalse();
                expect(testSubject.getCurrentState()).toBe(initialState);
                expect(initialOnEntrySpy.called).toBeTrue();
            });
        });
    });

    describe('switchTo', () => {
        let initialState: StatefulActionButtonState;
        let targetState: StatefulActionButtonState;
        let onInitialStateExitSpy: SinonSpy;
        let onTargetStateEntrySpy: SinonSpy;

        function expectUnsuccesfulTransition() {
            expect(testSubject.getCurrentState()).toBe(initialState);
            expect(onInitialStateExitSpy.called).toBeFalse();
            expect(onTargetStateEntrySpy.called).toBeFalse();
        }

        function expectSuccesfulTransition() {
            expect(spyConsoleWarn.called).toBeFalse();
            expect(testSubject.getCurrentState()).toBe(targetState);
            expect(onInitialStateExitSpy.called).toBeTrue();
            expect(onTargetStateEntrySpy.called).toBeTrue();
        }

        beforeEach(() => {
            [initialState, , onInitialStateExitSpy] = createSpiedState('initialState');
            [targetState, onTargetStateEntrySpy] = createSpiedState('targetState');
        });

        describe('if the state given in parameter is not in the options.state', () => {
            beforeEach(() => {
                testSubject = new StatefulActionButton(document.createElement('div'), {
                    states: [initialState],
                    initialState: initialState,
                });
            });

            it('should log a warning and do nothing else', () => {
                testSubject.switchTo(targetState);

                expect(
                    spyConsoleWarn.calledWithExactly(
                        "State 'targetState' does not exist on this StatefulActionButton\nEnsure to use the object references used at the instantiation."
                    )
                ).toBeTrue();
                expectUnsuccesfulTransition();
            });
        });

        describe('if the state given in parameter is in options.state but the transition is not allowed', () => {
            beforeEach(() => {
                let [notTargetState] = createSpiedState('notTargetState');
                testSubject = new StatefulActionButton(document.createElement('div'), {
                    states: [initialState, targetState, notTargetState],
                    initialState: initialState,
                    allowedTransitions: [{ from: initialState, to: notTargetState }],
                });
            });

            it('should log a warning and do nothing else', () => {
                testSubject.switchTo(targetState);

                expect(
                    spyConsoleWarn.calledWithExactly(
                        "Transition from State 'initialState' to State 'targetState' is not allowed on this StatefulActionButton.\nEnsure to use the object references used at the instantiation."
                    )
                ).toBeTrue();
                expectUnsuccesfulTransition();
            });
        });

        [null, undefined].forEach((allowedTransitionsValue) => {
            describe(`if the state given in parameter is in options.state and allowedTransition is ${
                allowedTransitionsValue?.length === 0 ? '[]' : allowedTransitionsValue
            }`, () => {
                beforeEach(() => {
                    testSubject = new StatefulActionButton(document.createElement('div'), {
                        states: [initialState, targetState],
                        initialState: initialState,
                        allowedTransitions: allowedTransitionsValue,
                    });
                });

                it('should not log a warning and do the transition', () => {
                    testSubject.switchTo(targetState);

                    expectSuccesfulTransition();
                });
            });
        });

        describe('if the state given in parameter is in options.state and the transition is explicitely allowed', () => {
            beforeEach(() => {
                testSubject = new StatefulActionButton(document.createElement('div'), {
                    states: [initialState, targetState],
                    initialState: initialState,
                    allowedTransitions: [{ from: initialState, to: targetState }],
                });
            });

            it('should not log a warning and do the transition', () => {
                testSubject.switchTo(targetState);

                expectSuccesfulTransition();
            });
        });
    });
});
