import { SinonSandbox, createSandbox, SinonSpy } from 'sinon';
import { Mock } from 'coveo-search-ui-tests';
import { ToggleActionButton } from '../../../src/components/ActionButton/ToggleActionButton';
import * as icons from '../../../src/utils/icons';
import { ActionButton } from '../../../src/components/ActionButton/ActionButton';
import { IComponentOptions } from 'coveo-search-ui';
import { IToggleableButtonOptions } from '../../../src/components/ActionButton/ToggleableButton';
import { StatefulActionButton } from '../../../src/components/ActionButton/StatefulActionButton';
import { defer } from '../../utils';

describe('ToggleActionButton', () => {
    let sandbox: SinonSandbox;
    let options: IToggleableButtonOptions;
    let testSubject: ToggleActionButton;

    let clickSpy: SinonSpy;
    let activateSpy: SinonSpy;
    let deactivateSpy: SinonSpy;
    let updateIconSpy: SinonSpy;
    let updateTooltipSpy: SinonSpy;
    let switchToSpy: SinonSpy;

    beforeAll(() => {
        sandbox = createSandbox();

        clickSpy = sandbox.spy();
        activateSpy = sandbox.spy();
        deactivateSpy = sandbox.spy();
        updateIconSpy = sandbox.spy(<any>ActionButton.prototype, 'updateIcon');
        updateTooltipSpy = sandbox.spy(<any>ActionButton.prototype, 'updateTooltip');
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
        };

        testSubject = createToggleButton(options);
    });

    afterEach(() => {
        sandbox.reset();
    });

    function createToggleButton(options: IToggleableButtonOptions) {
        const element = document.createElement('button');
        const componentSetup = Mock.advancedComponentSetup<ToggleActionButton>(
            ToggleActionButton,
            new Mock.AdvancedComponentSetupOptions(element, options)
        );
        return componentSetup.cmp;
    }

    function getOption(optionName: string): IComponentOptions<any> {
        const dictOptions = ToggleActionButton.options as { [key: string]: any };
        return dictOptions[optionName] as IComponentOptions<any>;
    }

    describe('clicking the button', () => {
        beforeEach(() => {
            Coveo.$$(testSubject.element).trigger('click');
        });

        it('should call the click handler', () => {
            expect(clickSpy.called).toBeTrue();
        });
    });

    describe('activating the button', () => {
        beforeEach(() => {
            testSubject.setActivated(true);
        });

        it('should have the isActivated method return true', () => {
            expect(testSubject.isActivated()).toBeTrue();
        });

        it('should call the activate handler', () => {
            expect(activateSpy.called).toBeTrue();
        });

        it('should add the activated marker CSS class', () => {
            const hasMarkerClass = testSubject.element.classList.contains(ToggleActionButton.ACTIVATED_CLASS_NAME);
            expect(hasMarkerClass).toBeTrue();
        });

        it('should set aria-pressed attribute to true', () => {
            const attributeValue = testSubject.element.getAttribute('aria-pressed');

            expect(attributeValue).toEqual('true');
        });

        it('should update button with deactivate icon', () => {
            expect(updateIconSpy.calledWith(options.deactivateIcon)).toBeTrue();
        });

        it('should update button with deactivate tooltip', () => {
            expect(updateTooltipSpy.calledWith(options.deactivateTooltip)).toBeTrue();
        });
    });

    describe('deactivating the button', () => {
        beforeEach(() => {
            testSubject.setActivated(true);
            sandbox.reset();

            testSubject.setActivated(false);
        });

        it('should have the isActivated method return false', () => {
            expect(testSubject.isActivated()).toBeFalse();
        });

        it('should call the deactivate handler', () => {
            expect(deactivateSpy.called).toBeTrue();
        });

        it('should remove the activated marker CSS class', () => {
            const hasMarkerClass = testSubject.element.classList.contains(ToggleActionButton.ACTIVATED_CLASS_NAME);
            expect(hasMarkerClass).toBeFalse();
        });

        it('should set aria-pressed attribute to false', () => {
            const attributeValue = testSubject.element.getAttribute('aria-pressed');
            expect(attributeValue).toEqual('false');
        });

        it('should update button with activate icon', () => {
            expect(updateIconSpy.calledWith(options.activateIcon)).toBeTrue();
        });

        it('should update button with activate tooltip', () => {
            expect(updateTooltipSpy.calledWith(options.activateTooltip)).toBeTrue();
        });
    });

    describe('legacy options compatibility', () => {
        [
            { legacy: 'activatedIcon', current: 'deactivateIcon' },
            { legacy: 'activatedTooltip', current: 'deactivateTooltip' },
            { legacy: 'deactivatedIcon', current: 'activateIcon' },
            { legacy: 'deactivatedTooltip', current: 'activateTooltip' },
        ].forEach(({ legacy, current }) => {
            it(`should support legacy '${legacy}' option through '${current}'`, () => {
                const option = getOption(current);

                expect(option.alias).toContain(legacy);
            });
        });
    });

    describe('event-loop test', () => {
        let eventCompletionPromises: Array<Promise<void>>;
        beforeEach(() => {
            eventCompletionPromises = [];
        });

        describe(`if activated triggers an event that would activate the button. `, () => {
            const activateEvent = 'activate-event';

            beforeEach(() => {
                const activateWithEvent: (this: ToggleActionButton) => void = function () {
                    const deferred = defer();
                    eventCompletionPromises.push(deferred.promise);
                    this.element.dispatchEvent(new CustomEvent(activateEvent, { detail: deferred.resolve }));
                };
                options.activate = activateWithEvent;
                testSubject = createToggleButton(options);
                testSubject.element.addEventListener(activateEvent, (e: CustomEvent<() => void>) => {
                    testSubject.setActivated(true);
                    e.detail();
                });
            });

            describe('if already activated', () => {
                beforeEach(() => {
                    testSubject.setActivated(true);
                    sandbox.reset();
                });

                it('should not call switchTo when setActivated is called with true', async () => {
                    testSubject.setActivated(true);
                    for (let index = 0; index < eventCompletionPromises.length; index++) {
                        await eventCompletionPromises[index];
                    }
                    expect(switchToSpy.called).toBeFalse();
                });
            });

            describe('if not activated', () => {
                beforeEach(() => {
                    testSubject.setActivated(false);
                    sandbox.reset();
                });

                it('should call switchTo only once when setActivated is called with true', async () => {
                    testSubject.setActivated(true);
                    for (let index = 0; index < eventCompletionPromises.length; index++) {
                        await eventCompletionPromises[index];
                    }
                    expect(switchToSpy.calledOnce).toBeTrue();
                });
            });
        });

        describe(`if deactivated triggers an event that would deactivate the button. `, () => {
            const deactivateEvent = 'deactivate-event';
            beforeEach(() => {
                const deactivateWithEvent: (this: ToggleActionButton) => void = function () {
                    const deferred = defer();
                    eventCompletionPromises.push(deferred.promise);
                    this.element.dispatchEvent(new CustomEvent(deactivateEvent, { detail: deferred.resolve }));
                };
                options.deactivate = deactivateWithEvent;
                testSubject = createToggleButton(options);
                testSubject.element.addEventListener(deactivateEvent, (e: CustomEvent<() => void>) => {
                    testSubject.setActivated(false);
                    e.detail();
                });
            });

            describe('if already deactivated', () => {
                beforeEach(() => {
                    testSubject.setActivated(false);
                    sandbox.reset();
                });

                it('should not call switchTo when setActivated is called with false', async () => {
                    testSubject.setActivated(false);
                    for (let index = 0; index < eventCompletionPromises.length; index++) {
                        await eventCompletionPromises[index];
                    }
                    expect(switchToSpy.called).toBeFalse();
                });
            });

            describe('if activated', () => {
                beforeEach(() => {
                    testSubject.setActivated(true);
                    sandbox.reset();
                });

                it('should call switchTo only once when setActivated is called with false', async () => {
                    testSubject.setActivated(false);
                    for (let index = 0; index < eventCompletionPromises.length; index++) {
                        await eventCompletionPromises[index];
                    }
                    expect(switchToSpy.calledOnce).toBeTrue();
                });
            });
        });
    });
});
