import {
    ToggleUnactivatedState,
    IToggleableButtonOptions,
    ToggleActivatedState,
    IToggleableButton,
} from '../../../src/components/ActionButton/ToggleableButton';
import { createSandbox, SinonSandbox, SinonSpy } from 'sinon';

describe('ToggleStates', () => {
    let sandbox: SinonSandbox;

    let testElement: HTMLElement;
    let fakeStatefulActionButton: { element: HTMLElement };
    let onClickSpy: SinonSpy;
    const toggleStateOptions: IToggleableButtonOptions = {
        activateIcon: 'someActivateIcon',
        activateTooltip: 'someActivateTooltip',
        deactivateIcon: 'someDeactivateIcon',
        deactivateTooltip: 'someDeactivatedTooltip',
    };

    beforeAll(() => {
        sandbox = createSandbox();
    });

    beforeEach(() => {
        testElement = document.createElement('div');
        fakeStatefulActionButton = { element: testElement };
        onClickSpy = sandbox.spy();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('ToggleUnactivatedState', () => {
        let testSubject: ToggleUnactivatedState;
        beforeEach(() => {
            testSubject = new ToggleUnactivatedState({
                options: toggleStateOptions,
                onClick: onClickSpy,
            });
        });

        describe('constructor', () => {
            it('should use the deactivateIcon, deactivateTooltip from the option of the ToggleableButton', () => {
                expect(testSubject.icon).toBe('someActivateIcon');
                expect(testSubject.tooltip).toBe('someActivateTooltip');
            });

            it('should use the onclick of the ToggleableButton', () => {
                testSubject.click();
                expect(onClickSpy.calledOnce).toBeTrue();
            });
        });
    });

    describe('ToggleActivatedState', () => {
        let testSubject: ToggleActivatedState;
        beforeEach(() => {
            testSubject = new ToggleActivatedState({
                options: toggleStateOptions,
                onClick: onClickSpy,
            });
        });

        describe('constructor', () => {
            it('should use the deactivateIcon, deactivateTooltip from the option of the ToggleableButton', () => {
                expect(testSubject.icon).toBe('someDeactivateIcon');
                expect(testSubject.tooltip).toBe('someDeactivatedTooltip');
            });

            it('should use the onclick of the ToggleableButton', () => {
                testSubject.click();
                expect(onClickSpy.calledOnce).toBeTrue();
            });
        });

        describe('onStateEntry', () => {
            beforeEach(() => {
                testSubject.onStateEntry.apply(fakeStatefulActionButton);
            });
            it('should add coveo-toggleactionbutton-activated to the classlist on this.element of the caller', () => {
                expect(testElement.classList.value).toBe('coveo-toggleactionbutton-activated');
            });
            it('should set the attribute aria-pressed to true on this.element of the caller', () => {
                expect(testElement.getAttribute('aria-pressed')).toBe('true');
            });
            describe('if the toggleableButton options include activate', () => {
                let activateSpy: SinonSpy;
                let toggleableButton: IToggleableButton;

                beforeEach(() => {
                    activateSpy = sandbox.spy();
                    toggleableButton = {
                        options: { ...toggleStateOptions, activate: activateSpy },
                        onClick: onClickSpy,
                    };
                    testSubject = new ToggleActivatedState(toggleableButton);
                    testSubject.onStateEntry.apply(fakeStatefulActionButton);
                });

                it('should call call it with the toggleableButton for context', () => {
                    expect(activateSpy.calledOnce).toBeTrue();
                    expect(activateSpy.firstCall.thisValue).toBe(toggleableButton);
                });
            });
        });

        describe('onStateExit', () => {
            beforeEach(() => {
                testElement.classList.value = 'coveo-toggleactionbutton-activated';
                testElement.setAttribute('aria-pressed', 'true');
                testSubject.onStateExit.apply(fakeStatefulActionButton);
            });

            it('should remove coveo-actionbutton-disabled to the classlist on this.element of the caller', () => {
                expect(testElement.classList.value).toBe('');
            });
            it('should set the attribute aria-pressed to false on to this.element of the caller', () => {
                expect(testElement.getAttribute('aria-pressed')).toBe('false');
            });
            describe('if the toggleableButton options include deactivate', () => {
                let deactivateSpy: SinonSpy;
                let toggleableButton: IToggleableButton;
                beforeEach(() => {
                    deactivateSpy = sandbox.spy();
                    toggleableButton = {
                        options: { ...toggleStateOptions, deactivate: deactivateSpy },
                        onClick: onClickSpy,
                    };
                    testSubject = new ToggleActivatedState(toggleableButton);
                    testSubject.onStateExit.apply(fakeStatefulActionButton);
                });

                it('should call call it with the toggleableButton for context', () => {
                    expect(deactivateSpy.calledOnce).toBeTrue();
                    expect(deactivateSpy.firstCall.thisValue).toBe(toggleableButton);
                });
            });
        });
    });
});
