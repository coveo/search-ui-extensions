import { IQueryResult, $$ } from 'coveo-search-ui';
import { createSandbox, SinonStub, SinonSandbox } from 'sinon';
import { Mock, Fake } from 'coveo-search-ui-tests';
import { ResultAction } from '../../../src/components/ResultAction/ResultAction';

describe('ResultAction', () => {
    let sandbox: SinonSandbox;

    let componentSetup: Mock.IBasicComponentSetup<ResultActionMockImpl>;
    let result: IQueryResult;
    let element: HTMLElement;
    let testComponent: ResultActionMockImpl;
    let testOptions: Mock.AdvancedComponentSetupOptions;

    // Since ResultAction is abstract, create a mock implementation.
    class ResultActionMockImpl extends ResultAction {
        // Make functions public so they can be tested.
        public doAction: SinonStub;
        public init: () => void;
        public deactivate: (e?: string) => void;
    }

    beforeAll(() => {
        sandbox = createSandbox();
    });

    beforeEach(() => {
        result = Fake.createFakeResult();
        element = document.createElement('div');
        document.body.append(element);
        testOptions = new Mock.AdvancedComponentSetupOptions(element, { icon: 'someIcon', tooltip: 'someTooltip' });

        componentSetup = Mock.advancedResultComponentSetup(ResultActionMockImpl, result, testOptions);
        testComponent = componentSetup.cmp;
        testComponent.doAction = sandbox.stub();
    });

    afterEach(() => {
        sandbox.reset();
        sandbox.restore();
        $$(document.body)
            .children()
            .forEach((el) => el.remove());
    });

    describe('after construction', () => {
        it('should call resolveResult if no results are given', () => {
            const resolveResultStub = sandbox.stub(ResultActionMockImpl.prototype, 'resolveResult');

            componentSetup = Mock.advancedResultComponentSetup(ResultActionMockImpl, null, testOptions);
            testComponent = componentSetup.cmp;
            testComponent.doAction = sandbox.stub();

            expect(resolveResultStub.called).toBeTrue();
        });

        it('should be hidden by default', () => {
            expect(element.classList.contains('coveo-hidden')).toBeTrue();
            expect(element.hasChildNodes()).toBeFalse();
        });
    });

    describe('after initialization', () => {
        beforeEach(() => {
            testComponent.init();
        });

        it('should log a debug message if initialized twice', () => {
            const debugStub = sandbox.stub(testComponent.logger, 'debug');
            expect(debugStub.called).toBeFalse();
            testComponent.init();
            expect(debugStub.called).toBeTrue();
        });

        it('should be visible', () => {
            expect(element.classList.contains('coveo-hidden')).toBeFalse();
            expect(element.hasChildNodes()).toBeTrue();
        });

        it('should become invisible after deactivation', () => {
            testComponent.deactivate();
            expect(element.parentElement).toBeNull();
        });

        it('should be able to reinitialize after being deactivated', () => {
            testComponent.deactivate();
            testComponent.init();
            expect(element.classList.contains('coveo-hidden')).toBeFalse();
            expect(element.hasChildNodes()).toBeTrue();
        });

        it('should invoke the action when clicked', () => {
            element.click();
            expect(testComponent.doAction.called).toBeTrue();
        });
    });

    describe('options', () => {
        it('should not display an icon after initialization if *icon* is not set', () => {
            testComponent.options.icon = null;

            testComponent.init();

            expect(element.classList.contains('coveo-hidden')).toBeFalse();
            expect(element.querySelector('.coveo-icon')).toBeNull();
        });

        it('should not display a tooltip after initialization if *tooltip* is not set', () => {
            testComponent.options.tooltip = null;

            testComponent.init();

            expect(element.classList.contains('coveo-hidden')).toBeFalse();
            expect(element.querySelector('.coveo-tooltip')).toBeNull();
        });
    });
});
