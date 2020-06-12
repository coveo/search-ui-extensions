import { createSandbox, SinonSandbox, SinonSpy, spy } from 'sinon';
import { Mock } from 'coveo-search-ui-tests';
import { ActionButton, IActionButtonOptions } from '../../../src/components/ActionButton/ActionButton';
import * as icons from '../../../src/utils/icons';

describe('ActionButton', () => {
    let sandbox: SinonSandbox;
    let options: IActionButtonOptions;
    let testSubject: ActionButton;
    let consoleWarnSpy: SinonSpy;

    beforeAll(() => {
        sandbox = createSandbox();
    });

    beforeEach(() => {
        consoleWarnSpy = sandbox.spy(console, 'warn');

        options = {
            title: 'a default title',
            tooltip: 'a default tooltip',
            icon: icons.copy,
            click: () => {}
        };

        testSubject = createActionButton(options);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should not log warnings in the console', () => {
        expect(consoleWarnSpy.called).toBeFalse();
    });

    describe('with click option', () => {
        let clickHandlerSpy: SinonSpy;

        beforeEach(() => {
            clickHandlerSpy = spy();
            options.click = clickHandlerSpy;
            testSubject = createActionButton(options);
        });

        it('should call the handler when clicking the button', () => {
            testSubject.element.dispatchEvent(new Event('click', {}));

            expect(clickHandlerSpy.called).toBeTrue();
        });
    });

    describe('without click option', () => {
        beforeEach(() => {
            options.click = null;
            testSubject = createActionButton(options);
        });

        it('should log a warning in the console', () => {
            expect(consoleWarnSpy.called).toBeTrue();
        });
    });

    describe('without icon and title', () => {
        let hideElementSpy: SinonSpy;

        beforeEach(() => {
            hideElementSpy = sandbox.spy(Coveo.Dom.prototype, 'hide');

            options.title = '';
            options.icon = '';
            options.click = () => {};

            testSubject = createActionButton(options);
        });

        it('should not render the button icon child element', () => {
            const iconChild = testSubject.element.querySelector('.coveo-actionbutton_icon');
            expect(iconChild).toBeNull();
        });

        it('should not render the title child element', () => {
            const titleChild = testSubject.element.querySelector('.coveo-actionbutton_title');
            expect(titleChild).toBeNull();
        });

        it('should hide the button element', () => {
            expect(hideElementSpy.called).toBeTrue();
        });

        it('should log a warning in the console', () => {
            expect(consoleWarnSpy.called).toBeTrue();
        });
    });

    [
        {
            optionName: 'title',
            optionValue: 'some title',
            expectedSelector: '.coveo-actionbutton_title'
        },
        {
            optionName: 'icon',
            optionValue: icons.copy,
            expectedSelector: '.coveo-actionbutton_icon'
        },
        {
            optionName: 'tooltip',
            optionValue: 'Some Tooltip',
            expectedSelector: '.CoveoActionButton[title]'
        }
    ].forEach(testCase => {
        describe(`with empty ${testCase.optionName} option`, () => {
            beforeEach(() => {
                setOption(testCase.optionName, null);
                testSubject = createActionButton(options);
            });

            it(`should not include the element matching '${testCase.expectedSelector}'`, () => {
                const actual = testSubject.element.querySelector(testCase.expectedSelector);
                expect(actual).toBeNull();
            });
        });

        describe(`with ${testCase.optionName} option`, () => {
            beforeEach(() => {
                setOption(testCase.optionName, testCase.optionValue);
                testSubject = createActionButton(options);
            });

            it(`should include the element matching '${testCase.expectedSelector}'`, () => {
                const actual = testSubject.element.querySelector(testCase.expectedSelector);
                expect(actual).toBeDefined();
            });
        });
    });

    const createActionButton = (options: IActionButtonOptions) => {
        const element = document.createElement('button');
        const componentSetup = Mock.advancedComponentSetup<ActionButton>(ActionButton, new Mock.AdvancedComponentSetupOptions(element, options));
        return componentSetup.cmp;
    };

    const setOption = (optionName: string, optionValue: any) => {
        const dictOptions = options as { [key: string]: any };
        dictOptions[optionName] = optionValue;
    };
});
