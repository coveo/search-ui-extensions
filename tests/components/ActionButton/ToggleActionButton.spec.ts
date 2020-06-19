import { SinonSandbox, createSandbox, SinonSpy } from 'sinon';
import { Mock } from 'coveo-search-ui-tests';
import { IToggleActionButtonOptions, ToggleActionButton } from '../../../src/components/ActionButton/ToggleActionButton';
import * as icons from '../../../src/utils/icons';
import { ActionButton } from '../../../src/components/ActionButton/ActionButton';

describe('ToggleActionButton', () => {
    let sandbox: SinonSandbox;
    let options: IToggleActionButtonOptions;
    let testSubject: ToggleActionButton;

    let clickSpy: SinonSpy;
    let activateSpy: SinonSpy;
    let deactivateSpy: SinonSpy;
    let updateIconSpy: SinonSpy;
    let updateTooltipSpy: SinonSpy;

    beforeAll(() => {
        sandbox = createSandbox();

        clickSpy = sandbox.spy();
        activateSpy = sandbox.spy();
        deactivateSpy = sandbox.spy();
        updateIconSpy = sandbox.spy(<any>ActionButton.prototype, 'updateIcon');
        updateTooltipSpy = sandbox.spy(<any>ActionButton.prototype, 'updateTooltip');
    });

    beforeEach(() => {
        options = {
            activatedIcon: icons.duplicate,
            activatedTooltip: 'activated tooltip',
            deactivatedIcon: icons.copy,
            deactivatedTooltip: 'tooltip',
            click: clickSpy,
            activate: activateSpy,
            deactivate: deactivateSpy
        };

        testSubject = createToggleButton(options);
    });

    afterEach(() => {
        sandbox.reset();
    });

    function createToggleButton(options: IToggleActionButtonOptions) {
        const element = document.createElement('button');
        const componentSetup = Mock.advancedComponentSetup<ToggleActionButton>(
            ToggleActionButton,
            new Mock.AdvancedComponentSetupOptions(element, options)
        );
        return componentSetup.cmp;
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

        it('should update button with activated icon', () => {
            expect(updateIconSpy.calledWith(options.activatedIcon)).toBeTrue();
        });

        it('should update button with activated tooltip', () => {
            expect(updateTooltipSpy.calledWith(options.activatedTooltip)).toBeTrue();
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

        it('should update button with deactivated icon', () => {
            expect(updateIconSpy.calledWith(options.deactivatedIcon)).toBeTrue();
        });

        it('should update button with deactivated tooltip', () => {
            expect(updateTooltipSpy.calledWith(options.deactivatedTooltip)).toBeTrue();
        });
    });
});
