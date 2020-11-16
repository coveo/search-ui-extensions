import * as sinon from 'sinon';
import { IQueryResult, Logger, SearchEndpoint } from 'coveo-search-ui';
import { Mock, Fake } from 'coveo-search-ui-tests';
import { AugmentedResultList, IPromiseReturnArgs, IAugmentData } from '../../../src/components/AugmentedResultList/AugmentedResultList';

describe('AugmentedResultList', () => {
    let sandbox: sinon.SinonSandbox;

    let componentSetup: Mock.IBasicComponentSetup<AugmentedResultList>;
    let element: HTMLElement;
    let testOptions: Mock.AdvancedComponentSetupOptions;

    const resultData = [
        {
            id: '#001',
            name: 'bulbasaur',
            type: 'grass,poison',
        },
        {
            id: '#004',
            name: 'charmander',
            type: 'fire',
        },
        {
            id: '#007',
            name: 'squirtle',
            type: 'water',
        },
    ];

    const commonData = {
        evolution: 1,
        starter: true,
    };

    const returnData: IPromiseReturnArgs<IAugmentData> = {
        data: {
            resultData,
            commonData,
        },
    };

    const matchingIdField = '@id';

    const stubFetchAugmentData = (objectIds: string[]): Promise<IPromiseReturnArgs<IAugmentData>> => {
        return Promise.resolve(returnData);
    };

    const failingFetchStub = (objectIds: string[]): Promise<IPromiseReturnArgs<IAugmentData>> => {
        return Promise.reject('purposeful failure');
    };

    const createFakeResultsThatMatch = (numResults: number) => {
        const fakeResults = Fake.createFakeResults(numResults);
        fakeResults.results.forEach((result, index) => (result.raw.id = `#00${index}`));
        return fakeResults;
    };

    const createComponent = (fetchAugmentData?: (objectIds: string[]) => Promise<IPromiseReturnArgs<IAugmentData>>) => {
        element = document.createElement('div');
        document.body.append(element);
        testOptions = new Mock.AdvancedComponentSetupOptions(element, {
            matchingIdField,
            fetchAugmentData,
        });

        componentSetup = Mock.advancedComponentSetup(AugmentedResultList, testOptions);
        return componentSetup;
    };

    const verifyAugmentedResultData = (resultData: any, results: IQueryResult[]) => {
        resultData.forEach((data: any) => {
            const matchingResult = results.find((result) => result.raw.id === data.id);
            if (matchingResult) {
                for (const key in data) {
                    expect(matchingResult.raw[key]).toEqual(data[key]);
                }
            }
        });
    };

    const verifyUntouchedResults = (resultData: {}[], results: IQueryResult[]) => {
        const idString = matchingIdField.replace('@', '');

        resultData.forEach((data: any) => {
            const ids = resultData.map((data: any) => (data as any)[idString]);
            const otherResults = results.filter((result) => !ids.find((id) => (result as any)[idString] === id));

            otherResults.forEach((result: IQueryResult) => {
                for (const key in data) {
                    if (key !== idString) {
                        expect(result.raw[key]).toBeUndefined;
                    }
                }
            });
        });
    };

    const verifyAugmentedCommonData = (commonData: any, results: IQueryResult[]) => {
        results.forEach((result) => {
            for (const key in commonData) {
                expect(result.raw[key]).toEqual(commonData[key]);
            }
        });
    };

    const verifyAugmentedResults = (returnData: IPromiseReturnArgs<IAugmentData>, results: IQueryResult[]) => {
        verifyAugmentedResultData(returnData.data.resultData, results);
        verifyAugmentedCommonData(returnData.data.commonData, results);
        verifyUntouchedResults(returnData.data.resultData, results);
    };

    beforeAll(() => {
        Logger.disable();
    });

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        const endpoint = sandbox.createStubInstance(SearchEndpoint);
        endpoint.search.callsFake(() => Promise.resolve(createFakeResultsThatMatch(10)));
    });

    afterEach(() => {
        sandbox.restore();
    });

    afterAll(() => {
        Logger.enable();
    });

    it('should augment results with object data', (done) => {
        const numResults = 10;
        const data = createFakeResultsThatMatch(numResults);
        const test = createComponent(stubFetchAugmentData);

        test.cmp.buildResults(data).then(() => {
            expect(test.cmp.getDisplayedResults().length).toEqual(numResults);
            verifyAugmentedResults(returnData, test.cmp.getDisplayedResults());
            done();
        });
    });

    it("should NOT augment results if IDs don't match", (done) => {
        const numResults = 10;
        const data = Fake.createFakeResults(numResults);
        const test = createComponent(stubFetchAugmentData);

        test.cmp.buildResults(data).then(() => {
            expect(test.cmp.getDisplayedResults().length).toEqual(numResults);
            verifyAugmentedResults(returnData, test.cmp.getDisplayedResults());
            done();
        });
    });

    it('should still build results without augmenting if resultDataAction is missing', (done) => {
        const numResults = 10;
        const data = createFakeResultsThatMatch(numResults);
        const test = createComponent();

        test.cmp.buildResults(data).then(() => {
            expect(test.cmp.getDisplayedResults().length).toEqual(numResults);
            expect(test.cmp.getDisplayedResults()).toEqual(data.results);
            done();
        });
    });

    it('should fail gracefully and log an error', (done) => {
        const numResults = 10;
        const data = createFakeResultsThatMatch(numResults);
        const test = createComponent(failingFetchStub);
        const loggerSpy = sandbox.spy(Logger.prototype, 'error');

        test.cmp.buildResults(data).then(() => {
            expect(loggerSpy.calledWith(['Unable to fetch augment data.', 'purposeful failure'])).toBeTrue();
            done();
        });
    });
});
