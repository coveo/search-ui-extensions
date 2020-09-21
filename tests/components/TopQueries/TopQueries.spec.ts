import { IQuerySuggestResponse } from 'coveo-search-ui';
import { Mock } from 'coveo-search-ui-tests';
import { createSandbox, SinonSandbox } from 'sinon';
import { ITopQueriesOptions } from '../../../src/components/TopQueries/TopQueries';
import { TopQueries } from '../../../src/Index';

describe('TopQueries', () => {
    let sandbox: SinonSandbox;
    let mock: Mock.IBasicComponentSetup<TopQueries>;
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

    beforeEach(async () => {
        mock = Mock.basicComponentSetup<TopQueries>(TopQueries, options);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should hide itself if there are no suggestions', async () => {
        let stub = sandbox.stub(mock.env.searchEndpoint, 'getQuerySuggest');
        stub.returns(Promise.resolve(EMPTY_SUGGESTION));
        await mock.cmp.updateTopQueries();

        expect(stub.called);
        expect(mock.cmp.element.classList.contains('coveo-hidden')).toBeTrue();
    });

    it('should hide itself if there are no suggestions', async () => {
        let stub = sandbox.stub(mock.env.searchEndpoint, 'getQuerySuggest');
        stub.returns(Promise.resolve(EMPTY_SUGGESTION));
        await mock.cmp.updateTopQueries();

        expect(stub.called);
        expect(mock.cmp.element.classList.contains('coveo-hidden')).toBeTrue();
    });

    it('should hide itself if the query throws an exception', async () => {
        let stub = sandbox.stub(mock.env.searchEndpoint, 'getQuerySuggest');
        stub.throws('Error');
        await mock.cmp.updateTopQueries();

        expect(stub.called);
        expect(mock.cmp.element.classList.contains('coveo-hidden')).toBeTrue();
    });

    it('should be shown if there are suggestions', async () => {
        let stub = sandbox.stub(mock.env.searchEndpoint, 'getQuerySuggest');
        stub.returns(Promise.resolve(SUGGESTIONS));
        await mock.cmp.updateTopQueries();

        expect(stub.called);
        expect(mock.cmp.element.classList.contains('coveo-hidden')).toBeFalse();
    });

    it('should containt all suggestions in ActionButtons', async () => {
        let stub = sandbox.stub(mock.env.searchEndpoint, 'getQuerySuggest');
        stub.returns(Promise.resolve(SUGGESTIONS));
        await mock.cmp.updateTopQueries();

        let elems = mock.cmp.element.querySelectorAll('li');
        expect(elems.length == SUGGESTIONS.completions.length);
        expect(stub.called);
    });

    it('links should contain the suggestions expression', async () => {
        let stub = sandbox.stub(mock.env.searchEndpoint, 'getQuerySuggest');
        stub.returns(Promise.resolve(SUGGESTION));
        await mock.cmp.updateTopQueries();

        let elem = mock.cmp.element.querySelector('a');
        expect(elem.innerHTML == SUGGESTION.completions[0].expression);
        expect(stub.called);
    });

    it('links shouldb execute click method onClick with expression given as argument', async () => {
        let stub = sandbox.stub(mock.env.searchEndpoint, 'getQuerySuggest');
        stub.returns(Promise.resolve(SUGGESTION));
        await mock.cmp.updateTopQueries();

        let onClickSpy = sandbox.spy(mock.cmp.options, 'onClick');

        let elem = mock.cmp.element.querySelector('a');
        elem.click();

        expect(onClickSpy.called);
        expect(onClickSpy.args[0][0] == SUGGESTION.completions[0].expression);
    });
});
