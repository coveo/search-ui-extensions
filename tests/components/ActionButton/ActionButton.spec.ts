import { createSandbox, SinonSandbox, SinonSpy, spy } from 'sinon';
import { Mock } from 'coveo-search-ui-tests';
import { ActionButton, IActionButtonOptions } from '../../../src/components/ActionButton/ActionButton';
import * as icons from '../../../src/utils/icons';

describe('ActionButton', () => {
    let sandbox: SinonSandbox;
    let options: IActionButtonOptions;
    let testSubject: ActionButton;

    let appendIconSpy: SinonSpy;
    let appendTitleSpy: SinonSpy;
    let appendTooltipSpy: SinonSpy;

    beforeAll(() => {
        sandbox = createSandbox();
    });

    beforeEach(() => {
        options = {
            title: 'a default title',
            tooltip: 'a default tooltip',
            icon: icons.copy
        };

        testSubject = createActionButton(options);

        appendIconSpy = sandbox.spy(<any>ActionButton.prototype, 'appendIcon');
        appendTitleSpy = sandbox.spy(<any>ActionButton.prototype, 'appendTitle');
        appendTooltipSpy = sandbox.spy(<any>ActionButton.prototype, 'appendTooltip');
    });

    afterEach(() => {
        sandbox.restore();
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

    describe('without icon and title', () => {
        let renderSpy: SinonSpy;

        beforeEach(() => {
            renderSpy = sandbox.spy(<any>ActionButton.prototype, 'render');
            options.title = '';
            options.icon = '';

            testSubject = createActionButton(options);
        });

        it('should not render the button', () => {
            expect(renderSpy.called).toBeFalse();
        });
    });

    [
        {
            optionName: 'title',
            optionValue: 'some title',
            getSpy: () => appendTitleSpy
        },
        {
            optionName: 'icon',
            optionValue: icons.copy,
            getSpy: () => appendIconSpy
        },
        {
            optionName: 'tooltip',
            optionValue: 'Some Tooltip',
            getSpy: () => appendTooltipSpy
        }
    ].forEach(testCase => {
        describe(`with empty ${testCase.optionName} option`, () => {
            beforeEach(() => {
                setOption(testCase.optionName, null);
                testSubject = createActionButton(options);
            });

            it(`should not include the ${testCase.optionName}`, () => {
                expect(testCase.getSpy().called).toBeFalse();
            });
        });

        describe(`with ${testCase.optionName} option`, () => {
            beforeEach(() => {
                setOption(testCase.optionName, testCase.optionValue);
                testSubject = createActionButton(options);
            });

            it(`should include the ${testCase.optionName}`, () => {
                expect(testCase.getSpy().called).toBeTrue();
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
