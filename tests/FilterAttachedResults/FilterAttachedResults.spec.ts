import {
    FilterAttachedResults,
    IFilterAttachedResultsOptions
} from '../../src/components/FilterAttachedResults/FilterAttachedResults';
import { Mock, Simulate } from 'coveo-search-ui-tests';

describe('FilterAttachedResults', () => {
    let filter: Mock.IBasicComponentSetup<FilterAttachedResults>;

    beforeEach((done) => {
        filter = Mock.basicResultComponentSetup<FilterAttachedResults>(
            FilterAttachedResults
        );
        setTimeout(done, 0);
    });

    afterEach(() => {
        filter = null;
    });

    it("should have the required elements", () => {
        expect(filter.cmp.element.childNodes.length).toBe(1);
        const mainSection = filter.cmp.element.childNodes[0];
        expect(filter.cmp.element.querySelector('.CoveoFacet')).not.toBeNull();
        expect(mainSection.childNodes.length).toBe(1);
        expect(mainSection.firstChild.childNodes.length).toBe(1);
        expect(filter.cmp.element.querySelector('input[type=checkbox]')).not.toBeNull();
    });

    describe("when setting options", () => {
        beforeEach((done) => {
            filter = Mock.optionsComponentSetup<FilterAttachedResults, IFilterAttachedResultsOptions>(
                FilterAttachedResults,
                { text: "much rain", getUriHashes: () => ["foo", "bar"] }
            );
            setTimeout(done, 0);
        })

        it("should display the correct text", () => {
            expect(filter.cmp.element.querySelector('span').innerText).toBe("much rain");
        });

        it("should add ids to the query", () => {
            expect(filter.cmp.isSelected()).toBeFalsy();
            let queryData = Simulate.query(filter.env);
            expect(queryData.queryBuilder.advancedExpression.build()).not.toBeDefined();
            
            filter.cmp.toggle();

            expect(filter.cmp.isSelected()).toBeTruthy();
            queryData = Simulate.query(filter.env);
            expect(queryData.queryBuilder.advancedExpression.build()).toBe("@urihash=(foo,bar)");
        });
    });
});