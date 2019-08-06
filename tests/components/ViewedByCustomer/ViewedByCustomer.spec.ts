import { ViewedByCustomer } from '../../../src/Index';
import { Mock, Fake } from 'coveo-search-ui-tests';
import { IViewedByCustomerOptions } from '../../../src/components/ViewedByCustomer/ViewedByCustomer';
import { IQueryResult } from 'coveo-search-ui';
import { AdvancedComponentSetupOptions } from 'coveo-search-ui-tests/MockEnvironment';

describe('ViewedByCustomer', () => {
    const LABEL_CSS_CLASS = 'viewed-by-customer-label';
    const ICON_CSS_CLASS = 'viewed-by-customer-icon';

    describe('when the field isUserActionView of the result true', () => {
        const fakeResult: IQueryResult = { ...Fake.createFakeResult(), isUserActionView: true };

        it('should display the default label and the icon when no options are given', () => {
            const testComponent = Mock.advancedResultComponentSetup<ViewedByCustomer>(ViewedByCustomer, fakeResult).cmp;
            expect(testComponent.element.getElementsByClassName(ICON_CSS_CLASS).length).toBe(1);
            expect(testComponent.element.getElementsByClassName(LABEL_CSS_CLASS).length).toBe(1);
            expect((testComponent.element.getElementsByClassName(LABEL_CSS_CLASS).item(0) as HTMLSpanElement).innerText).toBe('Viewed by Customer');
        });

        it('should display the label given in the option if any is given', () => {
            const option = new Mock.AdvancedComponentSetupOptions();
            (option.cmpOptions as IViewedByCustomerOptions).label = 'test label';
            const testComponent = Mock.advancedResultComponentSetup<ViewedByCustomer>(ViewedByCustomer, fakeResult, option).cmp;
            expect(testComponent.element.getElementsByClassName(LABEL_CSS_CLASS).length).toBe(1);
            expect(testComponent.element.getElementsByClassName(LABEL_CSS_CLASS).item(0).innerHTML).toBe('test label');
        });

        it('should hide the icon if showIcon option is set to false', () => {
            const option = new Mock.AdvancedComponentSetupOptions();
            (option.cmpOptions as IViewedByCustomerOptions).showIcon = false;
            const testComponent = Mock.advancedResultComponentSetup<ViewedByCustomer>(ViewedByCustomer, fakeResult, option).cmp;
            expect(testComponent.element.getElementsByClassName(ICON_CSS_CLASS).length).toBe(0);
        });
    });

    [false, undefined, null].forEach(falsyValue => {
        describe(`when the field isUserActionView of the result is ${falsyValue}`, () => {
            const fakeResult: IQueryResult = { ...Fake.createFakeResult(), isUserActionView: falsyValue };

            it('should not display the component or add anything to its own DOM', () => {
                const option: AdvancedComponentSetupOptions = new Mock.AdvancedComponentSetupOptions();
                (option.cmpOptions as IViewedByCustomerOptions).showIcon = false;
                const testComponent = Mock.advancedResultComponentSetup<ViewedByCustomer>(ViewedByCustomer, fakeResult, option).cmp;
                expect(testComponent.element.children.length).toBe(0);
            });
        });
    });
});
