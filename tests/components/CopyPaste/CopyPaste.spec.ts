import { IQueryResult, $$, l } from 'coveo-search-ui';
import { createSandbox, SinonSandbox, SinonStub } from 'sinon';
import { Mock, Fake } from 'coveo-search-ui-tests';
import { CopyToClipboard, ICopyToClipboardOptions } from '../../../src/components/CopyToClipboard/CopyToClipboard';

describe('CopyToClipboard ResultAction', () => {
    let sandbox: SinonSandbox;

    let componentSetup: Mock.IBasicComponentSetup<CopyToClipboard>;
    let result: IQueryResult;
    let element: HTMLElement;
    let testComponent: CopyToClipboard;
    let testOptions: Mock.AdvancedComponentSetupOptions;
    let writeTextStub: SinonStub<[string], Promise<void>>;
    let execCommandStub: SinonStub<[string, boolean?, string?], boolean>;
    const buildResultAction = (options: ICopyToClipboardOptions = {}) => {
        result = Fake.createFakeResult();
        element = document.createElement('div');
        document.body.append(element);
        testOptions = new Mock.AdvancedComponentSetupOptions(element, options);

        result.title = 'some title';
        result.clickUri = 'some uri';

        componentSetup = Mock.advancedResultComponentSetup(CopyToClipboard, result, testOptions);
        testComponent = componentSetup.cmp;
    };

    beforeAll(() => {
        sandbox = createSandbox();
    });

    beforeEach(async () => {
        buildResultAction({});
        writeTextStub = sandbox.stub(navigator.clipboard, 'writeText').resolves();
        execCommandStub = sandbox.stub(document, 'execCommand');
    });

    afterEach(() => {
        sandbox.reset();
        sandbox.restore();
        $$(document.body)
            .children()
            .forEach(el => el.remove());
    });

    describe('on click', () => {
        it('should paste the result in the clipboard', async () => {
            testComponent.element.click();
            expect(writeTextStub.called).toBeTrue();
        });

        it('should paste the result in the clipboard when the navigation api fails', async () => {
            writeTextStub.rejects();
            testComponent.element.click();
            expect(writeTextStub.called).toBeTrue();
        });

        it('should change the tooltip text for "Copied!"', async () => {
            testComponent.element.click();

            // We need to run assumption in micro tasks context because clipboard api use promises.
            await Promise.resolve();
            expect(testComponent.element.querySelector<HTMLElement>('.coveo-caption-for-icon').innerText).toEqual(l('CopyToClipboard_copied'));
        });

        describe('when the clipboard api is not available', () => {
            beforeEach(() => {
                writeTextStub.get(() => undefined);
            });

            it('should paste the result in the clipboard when the clipboard api is not available', async () => {
                testComponent.element.click();
                expect(execCommandStub.called).toBeTrue();
            });

            it('should change the tooltip text for "Copied!"', async () => {
                testComponent.element.click();
                expect(testComponent.element.querySelector<HTMLElement>('.coveo-caption-for-icon').innerText).toEqual(l('CopyToClipboard_copied'));
            });
        });
    });

    describe('on mouseleave', () => {
        it('should change the tooltip text for "Copy"', () => {
            testComponent.element.querySelector<HTMLElement>('.coveo-caption-for-icon').innerText = 'patate';
            testComponent.element.dispatchEvent(new MouseEvent('mouseleave'));
            expect(testComponent.element.querySelector<HTMLElement>('.coveo-caption-for-icon').innerText).toEqual(l('CopyToClipboard_copy'));
        });

        describe('when the clipboard api is not available', () => {
            beforeEach(() => {
                writeTextStub.get(() => undefined);
            });

            it('should change the tooltip text for "Copy"', () => {
                testComponent.element.querySelector<HTMLElement>('.coveo-caption-for-icon').innerText = 'patate';
                testComponent.element.dispatchEvent(new MouseEvent('mouseleave'));
                expect(testComponent.element.querySelector<HTMLElement>('.coveo-caption-for-icon').innerText).toEqual(l('CopyToClipboard_copy'));
            });
        });
    });

    describe('options', () => {
        describe('template', () => {
            it('should use the provided template to fill the clipboard', () => {
                buildResultAction({ template: 'foo bar ${title}' });
                testComponent.element.click();
                expect(writeTextStub.args[0][0]).toEqual(`foo bar ${testComponent.result.title}`);
            });

            it('should use the "{title}\\n{clickUri}" template by default', () => {
                testComponent.element.click();
                expect(writeTextStub.args[0][0]).toEqual(`${testComponent.result.title}\n${testComponent.result.clickUri}`);
            });
        });

        describe('tooltip', () => {
            it('should use the provided tooltip', () => {
                const tooltipText = 'some tooltip';
                buildResultAction({ tooltip: tooltipText });
                expect(testComponent.element.querySelector<HTMLElement>('.coveo-caption-for-icon').innerText).toEqual(tooltipText);
            });
        });

        describe('successTooltip', () => {
            it('should use the provided successTooltip', async () => {
                const tooltipText = 'some success tooltip';
                buildResultAction({ successTooltip: tooltipText });
                testComponent.element.click();

                await Promise.resolve();
                expect(testComponent.element.querySelector<HTMLElement>('.coveo-caption-for-icon').innerText).toEqual(tooltipText);
            });

            it('should not change the tooltip if the successTooltip is an empty string', async () => {
                buildResultAction({ successTooltip: '' });
                testComponent.element.click();

                await Promise.resolve();
                expect(testComponent.element.querySelector<HTMLElement>('.coveo-caption-for-icon').innerText).toEqual(testComponent.options.tooltip);
            });
        });
    });
});
