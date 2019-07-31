import { ViewedByCustomer } from '../../../src/Index';
import { Mock, Fake } from 'coveo-search-ui-tests';
import { IViewedByCustomerOptions } from '../../../src/components/ViewedByCustomer/ViewedByCustomer';
import { IQueryResult } from 'coveo-search-ui';

describe('ViewedByCustomer', () => {
    describe('when the field isUserActionView of the result true', () => {
        const fakeResult: IQueryResult = { ...Fake.createFakeResult(), isUserActionView: true };

        it('should display the default label and the icon when no options are given', () => {
            const testComponent = Mock.advancedResultComponentSetup<ViewedByCustomer>(ViewedByCustomer, fakeResult).cmp;
            expect(testComponent.element.getElementsByClassName('viewed-by-customer-icon').length).toBe(1);
            expect(testComponent.element.getElementsByClassName('viewed-by-customer-label').length).toBe(1);
            expect(testComponent.element.getElementsByClassName('viewed-by-customer-label').item(0).innerHTML).toBe('Viewed by Customer');
        });

        it('should display the label given in the option if any is given', () => {
            const option = new Mock.AdvancedComponentSetupOptions();
            (option.cmpOptions as IViewedByCustomerOptions) = { label: 'test label' };
            const testComponent = Mock.advancedResultComponentSetup<ViewedByCustomer>(ViewedByCustomer, fakeResult, option).cmp;
            expect(testComponent.element.getElementsByClassName('viewed-by-customer-label').length).toBe(1);
            expect(testComponent.element.getElementsByClassName('viewed-by-customer-label').item(0).innerHTML).toBe('test label');
        });

        it('should hide the icon if showIcon option is set to false', () => {
            const option = new Mock.AdvancedComponentSetupOptions();
            (option.cmpOptions as IViewedByCustomerOptions) = { showIcon: false };
            const testComponent = Mock.advancedResultComponentSetup<ViewedByCustomer>(ViewedByCustomer, fakeResult, option).cmp;
            expect(testComponent.element.getElementsByClassName('viewed-by-customer-icon').length).toBe(0);
        });
    });

    describe('when the field isUserActionView of the result is false', () => {
        const fakeResult: IQueryResult = { ...Fake.createFakeResult(), isUserActionView: false };

        it('should hide the icon if showIcon option is set to false', () => {
            const option = new Mock.AdvancedComponentSetupOptions();
            (option.cmpOptions as IViewedByCustomerOptions) = { showIcon: false };
            const testComponent = Mock.advancedResultComponentSetup<ViewedByCustomer>(ViewedByCustomer, fakeResult, option).cmp;
            expect(testComponent.element.getElementsByClassName('viewed-by-customer-icon').length).toBe(0);
        });
    });
});
