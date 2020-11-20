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

    let commonData: any = {
        evolution: 1,
        starter: true,
    };

    const getReturnData = (): IPromiseReturnArgs<IAugmentData> => {
        return {
            data: {
                resultData,
                commonData,
            },
        };
    };

    const matchingIdField = '@id';

    const stubFetchAugmentData = (objectIds: string[]): Promise<IPromiseReturnArgs<IAugmentData>> => {
        return Promise.resolve(getReturnData());
    };

    const failingFetchStub = (objectIds: string[]): Promise<IPromiseReturnArgs<IAugmentData>> => {
        return Promise.reject('purposeful failure');
    };

    const testMatchingFunction = (augmentData: any, queryResult: IQueryResult) => {
        return augmentData.type === 'water' && augmentData.id === queryResult.raw.id;
    };

    const createFakeResultsThatMatch = (numResults: number) => {
        const fakeResults = Fake.createFakeResults(numResults);
        fakeResults.results.forEach((result, index) => (result.raw.id = `#00${index}`));
        return fakeResults;
    };

    const createComponent = (
        fetchAugmentData?: (objectIds: string[]) => Promise<IPromiseReturnArgs<IAugmentData>>,
        matchingFunction?: (augmentData: any, queryResult: IQueryResult) => boolean
    ) => {
        element = document.createElement('div');
        document.body.append(element);
        testOptions = new Mock.AdvancedComponentSetupOptions(element, {
            matchingIdField,
            fetchAugmentData,
            matchingFunction,
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

    const verifyAugmentedResults = (returnData: IPromiseReturnArgs<IAugmentData>, results: IQueryResult[], numResults: number) => {
        expect(results.length).toEqual(numResults);
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
        commonData = {
            evolution: 1,
            starter: true,
        };
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
            verifyAugmentedResults(getReturnData(), test.cmp.getDisplayedResults(), numResults);
            done();
        });
    });

    it('should augment results with object data using provided matching function', (done) => {
        const numResults = 10;
        const data = createFakeResultsThatMatch(numResults);
        const test = createComponent(stubFetchAugmentData, testMatchingFunction);

        test.cmp.buildResults(data).then(() => {
            const displayedResults = test.cmp.getDisplayedResults();
            expect(displayedResults.length).toEqual(numResults);
            expect(displayedResults.find((result) => result.raw.id === '#007').raw.name).toEqual('squirtle');
            expect(displayedResults.find((result) => result.raw.id === '#001').raw.name).toBeUndefined();
            expect(displayedResults.find((result) => result.raw.id === '#004').raw.name).toBeUndefined();
            done();
        });
    });

    it('should augment results with object data and log a trace if an overwrite occured', (done) => {
        const numResults = 10;
        const data = createFakeResultsThatMatch(numResults);
        const test = createComponent(stubFetchAugmentData);
        const loggerSpy = sandbox.spy(Logger.prototype, 'trace');

        // Set attribute to be overwritten.
        const overwrittenResult = data.results.find((res) => res.raw.id === '#001');
        overwrittenResult.raw.name = 'Mewtwo';

        test.cmp.buildResults(data).then(() => {
            expect(loggerSpy.calledWith(`The name field was overwritten on result: ${overwrittenResult.title}`)).toBeTrue();
            verifyAugmentedResults(getReturnData(), test.cmp.getDisplayedResults(), numResults);
            done();
        });
    });

    it('should augment results with object data over common data in case of overlap', (done) => {
        const numResults = 10;
        const data = createFakeResultsThatMatch(numResults);
        commonData.type = 'psychic';
        const test = createComponent(stubFetchAugmentData);
        const loggerSpy = sandbox.spy(Logger.prototype, 'trace');

        test.cmp.buildResults(data).then(() => {
            expect(loggerSpy.called).toBeTrue();
            verifyAugmentedResultData(getReturnData().data.resultData, test.cmp.getDisplayedResults());
            done();
        });
    });

    it("should NOT augment results if IDs don't match", (done) => {
        const numResults = 10;
        const data = Fake.createFakeResults(numResults);
        const test = createComponent(stubFetchAugmentData);

        test.cmp.buildResults(data).then(() => {
            verifyAugmentedResults(getReturnData(), test.cmp.getDisplayedResults(), numResults);
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

    it('should fail and throw error if both matching id field and matching function are missing', () => {
        let error: Error;
        try {
            const element = document.createElement('div');
            document.body.append(element);
            const testOptions = new Mock.AdvancedComponentSetupOptions(element, {
                fetchAugmentData: stubFetchAugmentData,
            });
            Mock.advancedComponentSetup(AugmentedResultList, testOptions);
        } catch (e) {
            error = e;
        }

        expect(error.message).toEqual('A matching id field or matching function is required.');
    });

    it('should fail gracefully and log an error if fetch is unsuccessful', (done) => {
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
