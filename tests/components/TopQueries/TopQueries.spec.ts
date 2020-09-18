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

    const SUGGESTIONS: IQuerySuggestResponse = {
        completions: [
            {
                expression: 'test1',
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
        /*mock = Mock.advancedComponentSetup<TopQueries>(
            TopQueries,
            new Mock.AdvancedComponentSetupOptions(null, options, (env) => {
                env.searchEndpoint = Mock.mockSearchEndpoint();
                env.searchEndpoint.getQuerySuggest = () => Promise.resolve(EMPTY_SUGGESTION);
                return env;
            })
        );*/

        mock = Mock.basicComponentSetup<TopQueries>(TopQueries, options);
    });

    afterEach(() => {
        sandbox.reset();
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
});
