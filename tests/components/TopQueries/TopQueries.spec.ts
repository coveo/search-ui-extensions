import { IQuerySuggestResponse, NoopAnalyticsClient } from 'coveo-search-ui';
import { Mock } from 'coveo-search-ui-tests';
import { createSandbox, SinonSandbox } from 'sinon';
import { ITopQueriesOptions } from '../../../src/components/TopQueries/TopQueries';
import { TopQueries } from '../../../src/Index';

describe('TopQueries', () => {
    let sandbox: SinonSandbox;
    const options: ITopQueriesOptions = {
        suggestionQueryParams: {
            q: '',
            searchHub: 'test',
        },
    };

    const EMPTY_SUGGESTION: IQuerySuggestResponse = {
        completions: [],
    };

    const SUGGESTION: IQuerySuggestResponse = {
        completions: [
            {
                expression: 'test1',
                score: 1,
                highlighted: 'testHighlight',
                executableConfidence: 1,
            },
        ],
    };

    const SUGGESTIONS: IQuerySuggestResponse = {
        completions: [
            {
                expression: 'test1',
                score: 1,
                highlighted: 'testHighlight',
                executableConfidence: 1,
            },
            {
                expression: 'test2',
                score: 1,
                highlighted: 'testHighlight',
                executableConfidence: 1,
            },
            {
                expression: 'test3',
                score: 1,
                highlighted: 'testHighlight',
                executableConfidence: 1,
            },
        ],
    };

    beforeAll(() => {
        sandbox = createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should hide itself if there are no suggestions', async () => {
        let topQueries = Mock.basicComponentSetup<TopQueries>(TopQueries, options);
        let stub = sandbox.stub(topQueries.env.searchEndpoint, 'getQuerySuggest');
        stub.returns(Promise.resolve(EMPTY_SUGGESTION));
        await topQueries.cmp.updateTopQueries();

        expect(stub.called).toBe(true);
        expect(topQueries.cmp.element.classList.contains('coveo-hidden')).toBe(true);
    });

    it('should hide itself if there are no suggestions', async () => {
        let topQueries = Mock.basicComponentSetup<TopQueries>(TopQueries, options);
        let stub = sandbox.stub(topQueries.env.searchEndpoint, 'getQuerySuggest');
        stub.returns(Promise.resolve(EMPTY_SUGGESTION));
        await topQueries.cmp.updateTopQueries();

        expect(stub.called).toBe(true);
        expect(topQueries.cmp.element.classList.contains('coveo-hidden')).toBe(true);
    });

    it('should hide itself if the query throws an exception', async () => {
        let topQueries = Mock.basicComponentSetup<TopQueries>(TopQueries, options);
        let stub = sandbox.stub(topQueries.env.searchEndpoint, 'getQuerySuggest');
        stub.throws('Error');
        await topQueries.cmp.updateTopQueries();

        expect(stub.called).toBe(true);
        expect(topQueries.cmp.element.classList.contains('coveo-hidden')).toBe(true);
    });

    it('should be shown if there are suggestions', async () => {
        let topQueries = Mock.basicComponentSetup<TopQueries>(TopQueries, options);
        let stub = sandbox.stub(topQueries.env.searchEndpoint, 'getQuerySuggest');
        stub.returns(Promise.resolve(SUGGESTIONS));
        await topQueries.cmp.updateTopQueries();

        expect(stub.called).toBe(true);
        expect(topQueries.cmp.element.classList.contains('coveo-hidden')).toBe(false);
    });

    it('should containt all suggestions in ActionButtons', async () => {
        let topQueries = Mock.basicComponentSetup<TopQueries>(TopQueries, options);
        let stub = sandbox.stub(topQueries.env.searchEndpoint, 'getQuerySuggest');
        stub.returns(Promise.resolve(SUGGESTIONS));
        await topQueries.cmp.updateTopQueries();

        let elems = topQueries.cmp.element.querySelectorAll('li');
        expect(elems.length).toBe(SUGGESTIONS.completions.length);
        expect(stub.called).toBe(true);
    });

    it('links should contain the suggestions expression', async () => {
        let topQueries = Mock.basicComponentSetup<TopQueries>(TopQueries, options);
        let stub = sandbox.stub(topQueries.env.searchEndpoint, 'getQuerySuggest');
        stub.returns(Promise.resolve(SUGGESTION));
        await topQueries.cmp.updateTopQueries();

        let elem = topQueries.cmp.element.querySelector('a');
        expect(elem.innerHTML).toBe(SUGGESTION.completions[0].expression);
        expect(stub.called).toBe(true);
    });

    it('links should execute click method onClick with expression given as argument', async () => {
        let topQueries = Mock.basicComponentSetup<TopQueries>(TopQueries, options);
        let stub = sandbox.stub(topQueries.env.searchEndpoint, 'getQuerySuggest');
        stub.returns(Promise.resolve(SUGGESTION));
        await topQueries.cmp.updateTopQueries();

        let onClickSpy = sandbox.spy(topQueries.cmp.options, 'onClick');

        let elem = topQueries.cmp.element.querySelector('a');
        elem.click();

        expect(onClickSpy.args[0][0]).toBe(SUGGESTION.completions[0].expression);
        expect(onClickSpy.args[0][1]).toBe(topQueries.cmp);
    });

    it('Default suggestion click should send a ua search event when clicking on suggestion', async () => {
        let topQueries = Mock.advancedComponentSetup<TopQueries>(
            TopQueries,
            new Mock.AdvancedComponentSetupOptions(null, options, (env) => {
                env.searchInterface.usageAnalytics = new NoopAnalyticsClient();
                return env;
            })
        );

        let stub = sandbox.stub(topQueries.env.searchEndpoint, 'getQuerySuggest');
        stub.returns(Promise.resolve(SUGGESTION));
        await topQueries.cmp.updateTopQueries();

        let logSearchStub = sandbox.stub(topQueries.env.searchInterface.usageAnalytics, 'logSearchEvent');

        let elem = topQueries.cmp.element.querySelector('a');
        elem.click();

        console.log(logSearchStub.called);
        expect(logSearchStub.called).toBe(true);
        expect(logSearchStub.args[0][0]).toBe(TopQueries.topQueriesClickActionCause);
        expect(logSearchStub.args[0][1]).toEqual({});
    });

    it('Default suggestion click should send an executeQuery request', async () => {
        let topQueries = Mock.basicComponentSetup<TopQueries>(TopQueries, options);
        let suggestSub = sandbox.stub(topQueries.env.searchEndpoint, 'getQuerySuggest');
        suggestSub.returns(Promise.resolve(SUGGESTION));
        await topQueries.cmp.updateTopQueries();

        let executeQuerySpy = sandbox.spy(topQueries.env.queryController, 'executeQuery');

        let elem = topQueries.cmp.element.querySelector('a');
        elem.click();

        expect(executeQuerySpy.called).toBe(true);
    });
});
