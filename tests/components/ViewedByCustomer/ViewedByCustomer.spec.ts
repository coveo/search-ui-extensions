import { ViewedByCustomer, UserActions } from '../../../src/Index';
import { Mock, Fake } from 'coveo-search-ui-tests';
import { IViewedByCustomerOptions } from '../../../src/components/ViewedByCustomer/ViewedByCustomer';
import { IQueryResult, Component } from 'coveo-search-ui';
import { AdvancedComponentSetupOptions } from 'coveo-search-ui-tests/MockEnvironment';
import { createSandbox, SinonSandbox } from 'sinon';

describe('ViewedByCustomer', () => {
    const LABEL_CSS_CLASS = 'viewed-by-customer-label';
    const ICON_CSS_CLASS = 'viewed-by-customer-icon';
    let sandbox: SinonSandbox;

    beforeAll(() => {
        sandbox = createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });
    describe('when a UserActions exists in the page template', () => {
        let option: AdvancedComponentSetupOptions;
        beforeEach(() => {
            option = new Mock.AdvancedComponentSetupOptions();
            option.modifyBuilder = (env: Mock.MockEnvironmentBuilder): Mock.MockEnvironmentBuilder => {
                const stubUserActions = document.createElement('div');
                stubUserActions.className = Component.computeCssClassNameForType(UserActions.ID);
                env.root.appendChild(stubUserActions);

                return env;
            };
        });

        describe('when the field isUserActionView of the result true', () => {
            const fakeResult: IQueryResult = { ...Fake.createFakeResult(), isUserActionView: true };

            it('should display the default label and the icon when no options are given', () => {
                const testComponent = Mock.advancedResultComponentSetup<ViewedByCustomer>(ViewedByCustomer, fakeResult, option).cmp;
                expect(testComponent.element.getElementsByClassName(ICON_CSS_CLASS).length).toBe(1);
                expect(testComponent.element.getElementsByClassName(LABEL_CSS_CLASS).length).toBe(1);
                expect((testComponent.element.getElementsByClassName(LABEL_CSS_CLASS).item(0) as HTMLSpanElement).innerText).toBe(
                    'Viewed by Customer'
                );
            });

            it('should display the label given in the option if any is given', () => {
                (option.cmpOptions as IViewedByCustomerOptions).label = 'test label';
                const testComponent = Mock.advancedResultComponentSetup<ViewedByCustomer>(ViewedByCustomer, fakeResult, option).cmp;
                expect(testComponent.element.getElementsByClassName(LABEL_CSS_CLASS).length).toBe(1);
                expect(testComponent.element.getElementsByClassName(LABEL_CSS_CLASS).item(0).innerHTML).toBe('test label');
            });

            it('should hide the icon if showIcon option is set to false', () => {
                (option.cmpOptions as IViewedByCustomerOptions).showIcon = false;
                const testComponent = Mock.advancedResultComponentSetup<ViewedByCustomer>(ViewedByCustomer, fakeResult, option).cmp;
                expect(testComponent.element.getElementsByClassName(ICON_CSS_CLASS).length).toBe(0);
            });
        });

        [false, undefined, null].forEach(falsyValue => {
            describe(`when the field isUserActionView of the result is ${falsyValue}`, () => {
                const fakeResult: IQueryResult = { ...Fake.createFakeResult(), isUserActionView: falsyValue };

                it('should not display the component or add anything to its own DOM', () => {
                    (option.cmpOptions as IViewedByCustomerOptions).showIcon = false;
                    const testComponent = Mock.advancedResultComponentSetup<ViewedByCustomer>(ViewedByCustomer, fakeResult, option).cmp;
                    expect(testComponent.element.children.length).toBe(0);
                });
            });
        });

        it('should resolve its result using Component.resolveResult when no result is provided to the constructor', () => {
            // We don't care about the result, it's just to have some stuff at the very least.
            const fakeResult: IQueryResult = { ...Fake.createFakeResult(), isUserActionView: true };
            const testEnvironment = Mock.advancedResultComponentSetup<ViewedByCustomer>(ViewedByCustomer, fakeResult, option).env;
            const resolveResultStub = sandbox.stub(ViewedByCustomer.prototype, 'resolveResult').returns(fakeResult);
            new ViewedByCustomer(testEnvironment.element, null, testEnvironment);
            expect(resolveResultStub.called).toBe(true);
        });

        it('should use the result provided to the constructor in priority', () => {
            const fakeResult: IQueryResult = { ...Fake.createFakeResult(), isUserActionView: true };
            const testEnvironment = Mock.advancedResultComponentSetup<ViewedByCustomer>(ViewedByCustomer, fakeResult, option).env;
            const resolveResultSpy = sandbox.spy(ViewedByCustomer.prototype, 'resolveResult');
            new ViewedByCustomer(testEnvironment.element, null, testEnvironment, fakeResult);
            expect(resolveResultSpy.called).toBe(false);
        });

        it('should throw if no result is provided to the constructor and none can be resolved', () => {
            const fakeResult: IQueryResult = { ...Fake.createFakeResult(), isUserActionView: true };
            const testEnvironment = Mock.advancedResultComponentSetup<ViewedByCustomer>(ViewedByCustomer, fakeResult, option).env;
            sandbox.stub(ViewedByCustomer.prototype, 'resolveResult').returns(undefined);
            return new Promise((resolve, reject) => {
                try {
                    new ViewedByCustomer(testEnvironment.element, null, testEnvironment);
                } catch (error) {
                    expect(error.message).toBe('No result found on result component ViewedByCustomer.');
                    resolve();
                }
                reject();
            });
        });
    });
});
