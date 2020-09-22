import { IQuerySuggestResponse, NoopAnalyticsClient } from 'coveo-search-ui';
import { Mock } from 'coveo-search-ui-tests';
import { IBasicComponentSetup } from 'coveo-search-ui-tests/MockEnvironment';
import { createSandbox, SinonSandbox } from 'sinon';
import { TopQueries } from '../../../src/Index';

describe('TopQueries', () => {
    let sandbox: SinonSandbox;

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

    async function basicTopQueriesSetup(querySuggestionResponse: any) {
        const topQueries = Mock.advancedComponentSetup<TopQueries>(
            TopQueries,
            new Mock.AdvancedComponentSetupOptions(null, {}, (env) => {
                env.searchInterface.usageAnalytics = new NoopAnalyticsClient();
                return env;
            })
        );
        const suggestStub = stubGetQuerySuggest(topQueries, querySuggestionResponse);
        await topQueries.cmp.updateTopQueries();
        return { topQueries, suggestStub };
    }

    function stubGetQuerySuggest(component: IBasicComponentSetup<TopQueries>, returnValue: any) {
        const suggestSub = sandbox.stub(component.env.searchEndpoint, 'getQuerySuggest');
        suggestSub.returns(Promise.resolve(returnValue));
        return suggestSub;
    }

    it('should hide itself if there are no suggestions', async () => {
        const { topQueries, suggestStub } = await basicTopQueriesSetup(EMPTY_SUGGESTION);

        expect(suggestStub.called).toBe(true);
        expect(topQueries.cmp.element.classList.contains('coveo-hidden')).toBe(true);
    });

    it('should hide itself if the query throws an exception', async () => {
        const topQueries = Mock.basicComponentSetup<TopQueries>(TopQueries, {});
        const suggestStub = sandbox.stub(topQueries.env.searchEndpoint, 'getQuerySuggest');
        suggestStub.throws('Error');
        await topQueries.cmp.updateTopQueries();

        expect(suggestStub.called).toBe(true);
        expect(topQueries.cmp.element.classList.contains('coveo-hidden')).toBe(true);
    });

    it('should hide itself if the query returns invalid data', async () => {
        const { topQueries, suggestStub } = await basicTopQueriesSetup({ this: { is: 'not valid data' } });

        expect(suggestStub.called).toBe(true);
        expect(topQueries.cmp.element.classList.contains('coveo-hidden')).toBe(true);
    });

    it('should be shown if there are suggestions', async () => {
        const { topQueries, suggestStub } = await basicTopQueriesSetup(SUGGESTIONS);

        expect(suggestStub.called).toBe(true);
        expect(topQueries.cmp.element.classList.contains('coveo-hidden')).toBe(false);
    });

    it('should containt all suggestions in ActionButtons', async () => {
        const { topQueries, suggestStub } = await basicTopQueriesSetup(SUGGESTIONS);

        const elems = topQueries.cmp.element.querySelectorAll('li');

        expect(suggestStub.called).toBe(true);
        expect(elems.length).toBe(SUGGESTIONS.completions.length);
    });

    it('links should contain the suggestions expression', async () => {
        const { topQueries, suggestStub } = await basicTopQueriesSetup(SUGGESTION);

        const elem = topQueries.cmp.element.querySelector('a');

        expect(suggestStub.called).toBe(true);
        expect(elem.innerHTML).toBe(SUGGESTION.completions[0].expression);
    });

    it('links should execute click method onClick with expression given as argument', async () => {
        const { topQueries, suggestStub } = await basicTopQueriesSetup(SUGGESTION);

        const onClickSpy = sandbox.spy(topQueries.cmp.options, 'onClick');

        const elem = topQueries.cmp.element.querySelector('a');
        elem.click();

        expect(suggestStub.called).toBe(true);
        expect(onClickSpy.args[0][0]).toBe(SUGGESTION.completions[0].expression);
        expect(onClickSpy.args[0][1]).toBe(topQueries.cmp);
    });

    it('Default suggestion click should send a ua search event when clicking on suggestion', async () => {
        const { topQueries, suggestStub } = await basicTopQueriesSetup(SUGGESTION);

        const logSearchStub = sandbox.stub(topQueries.env.searchInterface.usageAnalytics, 'logSearchEvent');

        const elem = topQueries.cmp.element.querySelector('a');
        elem.click();

        expect(suggestStub.called).toBe(true);
        expect(logSearchStub.called).toBe(true);
        expect(logSearchStub.args[0][0]).toBe(TopQueries.topQueriesClickActionCause);
        expect(logSearchStub.args[0][1]).toEqual({});
    });

    it('Default suggestion click should send an executeQuery request', async () => {
        const { topQueries, suggestStub } = await basicTopQueriesSetup(SUGGESTION);

        const executeQuerySpy = sandbox.spy(topQueries.env.queryController, 'executeQuery');

        const elem = topQueries.cmp.element.querySelector('a');
        elem.click();

        expect(suggestStub.called).toBe(true);
        expect(executeQuerySpy.called).toBe(true);
    });
});
