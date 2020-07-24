import { SinonSandbox, SinonSpy, createSandbox } from 'sinon';
import {
    IDisableableToggleActionButtonOptions,
    DisableableToggleActionButton,
} from '../../../src/components/ActionButton/DisableableToggleActionButton';
import * as icons from '../../../src/utils/icons';

import { Mock } from 'coveo-search-ui-tests';
import { StatefulActionButton } from '../../../src/components/ActionButton/StatefulActionButton';
import { ToggleUnactivatedState, ToggleActivatedState } from '../../../src/components/ActionButton/ToggleableButton';
import { DisabledState } from '../../../src/components/ActionButton/DisableableButton';

describe('DisableableToggleActionButton', () => {
    let sandbox: SinonSandbox;
    let options: IDisableableToggleActionButtonOptions;
    let testSubject: DisableableToggleActionButton;

    let clickSpy: SinonSpy;
    let activateSpy: SinonSpy;
    let deactivateSpy: SinonSpy;
    let switchToSpy: SinonSpy;

    beforeAll(() => {
        sandbox = createSandbox();

        clickSpy = sandbox.spy();
        activateSpy = sandbox.spy();
        deactivateSpy = sandbox.spy();
        switchToSpy = sandbox.spy(<any>StatefulActionButton.prototype, 'switchTo');
    });

    beforeEach(() => {
        options = {
            activateIcon: icons.copy,
            activateTooltip: 'Activate feature',
            deactivateIcon: icons.duplicate,
            deactivateTooltip: 'Deactivate feature',
            click: clickSpy,
            activate: activateSpy,
            deactivate: deactivateSpy,
            disabledIcon: icons.dot,
            disabledTooltip: 'Feature disabled',
        };

        testSubject = createToggleButton(options);
    });

    afterEach(() => {
        sandbox.reset();
    });

    function createToggleButton(options: IDisableableToggleActionButtonOptions) {
        const element = document.createElement('button');
        const componentSetup = Mock.advancedComponentSetup<DisableableToggleActionButton>(
            DisableableToggleActionButton,
            new Mock.AdvancedComponentSetupOptions(element, options)
        );
        return componentSetup.cmp;
    }

    describe('when disabled', () => {
        beforeEach(() => {
            testSubject.disable();
            switchToSpy.resetHistory();
        });

        it('clicking it should do nothing', () => {
            Coveo.$$(testSubject.element).trigger('click');
            expect(clickSpy.called).toBeFalse();
        });

        it('isActivated should return false', () => {
            expect(testSubject.isActivated()).toBeFalse();
        });

        it('isDisabled should return true', () => {
            expect(testSubject.isDisabled()).toBeTrue();
        });

        describe('setEnabled', () => {
            let spyEnable: SinonSpy;
            let spyDisable: SinonSpy;

            beforeEach(() => {
                spyEnable = sandbox.spy(testSubject, 'enable');
                spyDisable = sandbox.spy(testSubject, 'disable');
            });

            it('should do call disabled if called with false', () => {
                testSubject.setEnabled(false);

                expect(spyEnable.called).toBeFalse();
                expect(spyDisable.calledOnce).toBeTrue();
            });

            it('should call enable if called with true', () => {
                testSubject.setEnabled(true);

                expect(spyEnable.calledOnce).toBeTrue();
                expect(spyDisable.called).toBeFalse();
            });
        });

        describe('enable', () => {
            beforeEach(() => {
                testSubject.enable();
            });

            it('should call switchTo with the deactivatedState', () => {
                expect(switchToSpy.calledOnce).toBeTrue();
                expect(switchToSpy.firstCall.args[0] instanceof ToggleUnactivatedState).toBeTrue();
            });
        });

        describe('disable', () => {
            beforeEach(() => {
                testSubject.disable();
            });

            it('should not call switchTo at all', () => {
                expect(switchToSpy.called).toBeFalse();
            });
        });

        describe('setActivated', () => {
            it('should switch to deactivated if called with false', () => {
                testSubject.setActivated(false);

                expect(switchToSpy.calledOnce).toBeTrue();
                expect(switchToSpy.firstCall.args[0] instanceof ToggleUnactivatedState).toBeTrue();
            });

            it('should do nothing if called with true', () => {
                testSubject.setActivated(true);

                expect(switchToSpy.called).toBeFalse();
            });
        });
    });

    describe('when unactivated', () => {
        it('isActivated should return false', () => {
            expect(testSubject.isActivated()).toBeFalse();
        });
        it('isDisabled should return false', () => {
            expect(testSubject.isDisabled()).toBeFalse();
        });

        describe('when clicked on', () => {
            let setActivatedSpy: SinonSpy;
            beforeEach(() => {
                setActivatedSpy = sandbox.spy(testSubject, 'setActivated');
                Coveo.$$(testSubject.element).trigger('click');
            });

            it('should call the click handler and setActivated with true', () => {
                expect(clickSpy.called).toBeTrue();
                expect(setActivatedSpy.calledOnceWithExactly(true)).toBeTrue();
            });
        });

        describe('setEnabled', () => {
            let spyEnable: SinonSpy;
            let spyDisable: SinonSpy;

            beforeEach(() => {
                spyEnable = sandbox.spy(testSubject, 'enable');
                spyDisable = sandbox.spy(testSubject, 'disable');
            });

            it('should do call disabled if called with false', () => {
                testSubject.setEnabled(false);

                expect(spyEnable.called).toBeFalse();
                expect(spyDisable.calledOnce).toBeTrue();
            });

            it('should call enable if called with true', () => {
                testSubject.setEnabled(true);

                expect(spyEnable.calledOnce).toBeTrue();
                expect(spyDisable.called).toBeFalse();
            });
        });

        describe('enable', () => {
            beforeEach(() => {
                testSubject.enable();
            });

            it('should not call switchTo at all', () => {
                expect(switchToSpy.called).toBeFalse();
            });
        });

        describe('disable', () => {
            beforeEach(() => {
                testSubject.disable();
            });

            it('should call switchTo with the disabledState', () => {
                expect(switchToSpy.calledOnce).toBeTrue();
                expect(switchToSpy.firstCall.args[0] instanceof DisabledState).toBeTrue();
            });
        });

        describe('setActivated', () => {
            it('should do nothing if called with false', () => {
                testSubject.setActivated(false);

                expect(switchToSpy.called).toBeFalse();
            });

            it('should switch to activated if called with true', () => {
                testSubject.setActivated(true);

                expect(switchToSpy.calledOnce).toBeTrue();
                expect(switchToSpy.firstCall.args[0] instanceof ToggleActivatedState).toBeTrue();
            });
        });
    });

    describe('when activated', () => {
        beforeEach(() => {
            testSubject.setActivated(true);
            switchToSpy.resetHistory();
        });

        it('isActivated should return false', () => {
            expect(testSubject.isActivated()).toBeTrue();
        });

        it('isDisabled should return false', () => {
            expect(testSubject.isDisabled()).toBeFalse();
        });

        describe('when clicked on', () => {
            let setActivatedSpy: SinonSpy;
            beforeEach(() => {
                setActivatedSpy = sandbox.spy(testSubject, 'setActivated');
                Coveo.$$(testSubject.element).trigger('click');
            });

            it('should call the click handler and setActivated with false', () => {
                expect(clickSpy.called).toBeTrue();
                expect(setActivatedSpy.calledOnceWithExactly(false)).toBeTrue();
            });
        });

        describe('setEnabled', () => {
            let spyEnable: SinonSpy;
            let spyDisable: SinonSpy;

            beforeEach(() => {
                spyEnable = sandbox.spy(testSubject, 'enable');
                spyDisable = sandbox.spy(testSubject, 'disable');
            });

            it('should do call disabled if called with false', () => {
                testSubject.setEnabled(false);

                expect(spyEnable.called).toBeFalse();
                expect(spyDisable.calledOnce).toBeTrue();
            });

            it('should call enable if called with true', () => {
                testSubject.setEnabled(true);

                expect(spyEnable.calledOnce).toBeTrue();
                expect(spyDisable.called).toBeFalse();
            });
        });

        describe('enable', () => {
            beforeEach(() => {
                testSubject.enable();
            });

            it('should not call switchTo at all', () => {
                expect(switchToSpy.called).toBeFalse();
            });
        });

        describe('disable', () => {
            beforeEach(() => {
                testSubject.disable();
            });

            it('should call switchTo with the unactivatedState and then with the disabledState', () => {
                expect(switchToSpy.calledTwice).toBeTrue();
                expect(switchToSpy.firstCall.args[0] instanceof ToggleUnactivatedState).toBeTrue();
                expect(switchToSpy.secondCall.args[0] instanceof DisabledState).toBeTrue();
            });
        });

        describe('setActivated', () => {
            it('should do nothing if called with true', () => {
                testSubject.setActivated(true);

                expect(switchToSpy.called).toBeFalse();
            });

            it('should switch to unactivated if called with false', () => {
                testSubject.setActivated(false);

                expect(switchToSpy.calledOnce).toBeTrue();
                expect(switchToSpy.firstCall.args[0] instanceof ToggleUnactivatedState).toBeTrue();
            });
        });
    });
});
