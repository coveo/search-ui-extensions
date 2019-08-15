import { ResultsFilter, IResultsFilterOptions } from '../../../src/components/ResultsFilter/ResultsFilter';
import { Mock, Simulate } from 'coveo-search-ui-tests';
import { QueryStateModel, Assert } from 'coveo-search-ui';
import { ResultsFilterEvents, IResultsFilterEventArgs } from '../../../src/components/ResultsFilter/Events';

describe('ResultsFilter', () => {
    let filter: Mock.IBasicComponentSetup<ResultsFilter>;

    beforeEach(() => {
        filter = Mock.advancedComponentSetup<ResultsFilter>(
            ResultsFilter,
            new Mock.AdvancedComponentSetupOptions(undefined, undefined, (env: Mock.MockEnvironmentBuilder) => {
                return env.withLiveQueryStateModel();
            })
        );
        return Promise.resolve();
    });

    afterEach(() => {
        filter = null;
    });

    it('should have default options', () => {
        expect(filter.cmp.options.text).toBe('Filter Results');
        expect(filter.cmp.options.field).toBe('urihash');
        expect(filter.cmp.options.getValues).not.toBeNull();
    });

    it('should have the required elements', () => {
        expect(filter.cmp.element.childNodes.length).toBe(1);
        const mainSection = filter.cmp.element.childNodes[0];
        expect(filter.cmp.element.querySelector('.CoveoFacet')).not.toBeNull();
        expect(mainSection.childNodes.length).toBe(1);
        expect(mainSection.firstChild.childNodes.length).toBe(1);
        expect(filter.cmp.element.querySelector('input[type=checkbox]')).not.toBeNull();
    });

    it('handles query state changes', () => {
        expect(filter.cmp.isSelected()).toBeFalsy();
        filter.env.queryStateModel.set(QueryStateModel.getFacetId(ResultsFilter.ID), true);
        expect(filter.cmp.isSelected()).toBeTruthy();
        filter.env.queryStateModel.set(QueryStateModel.getFacetId(ResultsFilter.ID), false);
        expect(filter.cmp.isSelected()).toBeFalsy();
    });

    it('should trigger events on toggling', done => {
        let cpt = 0;
        Coveo.$$(filter.env.root).on(ResultsFilterEvents.Click, (evt: Event, args: IResultsFilterEventArgs) => {
            expect(evt.type).toBe(ResultsFilterEvents.Click);
            if (args.checked) {
                cpt++;
            } else {
                cpt++;
            }
            if (cpt == 2) {
                done();
            }
        });
        filter.cmp.toggle();
        filter.cmp.toggle();
    });

    describe('when setting options', () => {
        beforeEach(() => {
            filter = Mock.optionsComponentSetup<ResultsFilter, IResultsFilterOptions>(ResultsFilter, {
                text: 'much rain',
                field: 'myField',
                getValues: () => ['foo', 'bar']
            });
            return Promise.resolve();
        });

        it('should display the correct text', () => {
            expect(filter.cmp.element.querySelector('span').innerText).toBe('much rain');
        });

        it('should add ids to the query', () => {
            expect(filter.cmp.isSelected()).toBeFalsy();
            let queryData = Simulate.query(filter.env);
            expect(queryData.queryBuilder.advancedExpression.build()).not.toBeDefined();

            filter.cmp.toggle();

            expect(filter.cmp.isSelected()).toBeTruthy();
            queryData = Simulate.query(filter.env);
            expect(queryData.queryBuilder.advancedExpression.build()).toBe('@myField=(foo,bar)');

            filter.cmp.toggle();
            expect(filter.cmp.isSelected()).toBeFalsy();
        });
    });
});
