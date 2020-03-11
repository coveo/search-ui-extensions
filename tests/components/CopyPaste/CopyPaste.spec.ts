import { IQueryResult, $$, l } from 'coveo-search-ui';
import { createSandbox, SinonSandbox, SinonStub } from 'sinon';
import { Mock, Fake } from 'coveo-search-ui-tests';
import { CopyToClipboard } from '../../../src/components/CopyToClipboard/CopyToClipboard';

describe('CopyToClipboard ResultAction', () => {
    let sandbox: SinonSandbox;

    let componentSetup: Mock.IBasicComponentSetup<CopyToClipboard>;
    let result: IQueryResult;
    let element: HTMLElement;
    let testComponent: CopyToClipboard;
    let testOptions: Mock.AdvancedComponentSetupOptions;
    let writeTextStub: SinonStub<[string], Promise<void>>;
    let execCommandStub: SinonStub<[string, boolean?, string?], boolean>;

    beforeAll(() => {
        sandbox = createSandbox();
    });

    beforeEach(async () => {
        result = Fake.createFakeResult();
        element = document.createElement('div');
        document.body.append(element);
        testOptions = new Mock.AdvancedComponentSetupOptions(element);

        result.title = 'some title';
        result.clickUri = 'some uri';

        componentSetup = Mock.advancedResultComponentSetup(CopyToClipboard, result, testOptions);
        testComponent = componentSetup.cmp;
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

    describe('the template option', () => {
        it('should use the provided template to fill the clipboard', () => {
            testComponent.options.template = 'foo bar ${title}';
            testComponent.element.click();
            expect(writeTextStub.args[0][0]).toEqual(`foo bar ${testComponent.result.title}`);
        });
        it('should use the "{title}\\n{clickUri}" template by default', () => {
            testComponent.element.click();
            expect(writeTextStub.args[0][0]).toEqual(`${testComponent.result.title}\n${testComponent.result.clickUri}`);
        });
    });
});
