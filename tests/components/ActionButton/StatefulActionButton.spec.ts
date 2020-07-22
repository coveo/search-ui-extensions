import { StatefulActionButton, IStatefulActionButtonState } from '../../../src/components/ActionButton/StatefulActionButton';
import { createSandbox, SinonSpy, SinonSandbox } from 'sinon';

describe('StatefulActionButton', () => {
    let testSubject: StatefulActionButton;
    let sandbox: SinonSandbox;
    let spyConsoleWarn: SinonSpy;
    const createSpiedState: () => [IStatefulActionButtonState, SinonSpy, SinonSpy] = () => {
        const stateEntrySpy = sandbox.spy();
        const stateExitSpy = sandbox.spy();
        const state: IStatefulActionButtonState = {
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
        let initialState: IStatefulActionButtonState;
        let initialOnEntrySpy: SinonSpy;

        beforeEach(() => {
            [initialState, initialOnEntrySpy] = createSpiedState();
        });

        [
            {
                describe: 'if states is not defined',
                beforeEach: () => {
                    testSubject = new StatefulActionButton(document.createElement('div'), { states: undefined, initalState: initialState });
                },
            },
            {
                describe: 'if states is empty',
                beforeEach: () => {
                    testSubject = new StatefulActionButton(document.createElement('div'), { states: [] as any, initalState: initialState });
                },
            },
            {
                describe: 'if initialState is not defined',
                beforeEach: () => {
                    testSubject = new StatefulActionButton(document.createElement('div'), { states: [initialState], initalState: undefined });
                },
            },
            {
                describe: 'if states does not include initialState',
                beforeEach: () => {
                    testSubject = new StatefulActionButton(document.createElement('div'), {
                        states: [createSpiedState()[0]],
                        initalState: initialState,
                    });
                },
            },
        ].forEach((testCase) => {
            describe(testCase.describe, () => {
                beforeEach(testCase.beforeEach);

                it(`should hide the button, log an appropriate warning and not complete the initialization`, () => {
                    spyConsoleWarn.calledWithExactly('The stateful action button cannot render if no states are defined.');
                    expect(testSubject.getCurrentState()).toBeUndefined();
                    expect(initialOnEntrySpy.called).toBeFalse();
                });
            });
        });

        describe('if the options are valid', () => {
            beforeEach(() => {
                [initialState, initialOnEntrySpy] = createSpiedState();
                testSubject = new StatefulActionButton(document.createElement('div'), { states: [initialState], initalState: initialState });
            });

            it('should complete the initialization', () => {
                expect(spyConsoleWarn.called).toBeFalse();
                expect(testSubject.getCurrentState()).toBe(initialState);
                expect(initialOnEntrySpy.called).toBeTrue();
            });
        });
    });

    describe('switchTo', () => {
        let initialState: IStatefulActionButtonState;
        let targetState: IStatefulActionButtonState;
        let onInitialStateExitSpy: SinonSpy;
        let onTargetStateEntrySpy: SinonSpy;

        function expectOnlyWarning() {
            expect(spyConsoleWarn.calledWithExactly('This state is not allowed on this StatefulActionButton.'));
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
            [initialState, , onInitialStateExitSpy] = createSpiedState();
            [targetState, onTargetStateEntrySpy] = createSpiedState();
        });

        describe('if the state given in parameter is not in the options.state', () => {
            beforeEach(() => {
                testSubject = new StatefulActionButton(document.createElement('div'), {
                    states: [initialState],
                    initalState: initialState,
                });
            });

            it('should log a warning and do nothing else', () => {
                testSubject.switchTo(targetState);

                expectOnlyWarning();
            });
        });

        describe('if a state cannot be switched to and have a name', () => {
            let namedState: IStatefulActionButtonState;
            beforeEach(() => {
                namedState = {
                    name: 'some state name',
                    title: 'foo',
                };
                testSubject = new StatefulActionButton(document.createElement('div'), {
                    states: [initialState],
                    initalState: initialState,
                });
            });

            it('should log a warning with the name of the test', () => {
                testSubject.switchTo(namedState);
                expect(spyConsoleWarn.calledWithExactly('some state name is not allowed on this StatefulActionButton.'));
            });
        });

        describe('if the state given in parameter is in options.state but the transition is not allowed', () => {
            beforeEach(() => {
                let [notTargetState] = createSpiedState();
                testSubject = new StatefulActionButton(document.createElement('div'), {
                    states: [initialState, targetState],
                    initalState: initialState,
                    allowedTransitions: [{ from: initialState, to: notTargetState }],
                });
            });

            it('should log a warning and do nothing else', () => {
                testSubject.switchTo(targetState);

                expectOnlyWarning();
            });
        });

        [null, undefined].forEach((allowedTransitionsValue) => {
            describe(`if the state given in parameter is in options.state and allowedTransition is ${
                allowedTransitionsValue?.length === 0 ? '[]' : allowedTransitionsValue
            }`, () => {
                beforeEach(() => {
                    testSubject = new StatefulActionButton(document.createElement('div'), {
                        states: [initialState, targetState],
                        initalState: initialState,
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
                    initalState: initialState,
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
