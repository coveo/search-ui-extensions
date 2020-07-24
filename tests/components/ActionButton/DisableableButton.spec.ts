import { DisabledState } from '../../../src/components/ActionButton/DisableableButton';

describe('DisabledState', () => {
    let testElement: HTMLElement;
    let testSubject: DisabledState;
    let fakeStatefulActionButton: { element: HTMLElement };

    beforeEach(() => {
        testElement = document.createElement('div');
        fakeStatefulActionButton = { element: testElement };
        testSubject = new DisabledState({ options: { disabledIcon: 'someSvgIcon', disabledTooltip: 'someTooltip' } });
    });

    describe('constructor', () => {
        it('should use the icon and tooltip from the option of the disabledButton', () => {
            expect(testSubject.icon).toBe('someSvgIcon');
            expect(testSubject.tooltip).toBe('someTooltip');
        });
    });

    describe('onStateEntry', () => {
        beforeEach(() => {
            testSubject.onStateEntry.apply(fakeStatefulActionButton);
        });

        it('should add coveo-actionbutton-disabled to the classlist on this.element of the caller', () => {
            expect(testElement.classList.value).toBe('coveo-actionbutton-disabled');
        });

        it('should add the attribute disabled to this.element of the caller', () => {
            expect(testElement.hasAttribute('disabled')).toBeTrue();
        });
    });

    describe('onStateExit', () => {
        beforeEach(() => {
            testElement.classList.value = 'coveo-actionbutton-disabled';
            testElement.setAttribute('disabled', '');
            testSubject.onStateExit.apply(fakeStatefulActionButton);
        });

        it('should remove coveo-actionbutton-disabled to the classlist on this.element of the caller', () => {
            expect(testElement.classList.value).toBe('');
        });

        it('should remove the attribute disabled to this.element of the caller', () => {
            expect(testElement.hasAttribute('disabled')).toBeFalse();
        });
    });
});
