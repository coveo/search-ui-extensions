import * as sinon from 'sinon';
import { IQueryResult, Logger, SearchEndpoint } from 'coveo-search-ui';
import { Mock, Fake } from 'coveo-search-ui-tests';
import { AugmentedResultList, IPromiseReturnArgs } from '../../../src/components/AugmentedResultList/AugmentedResultList';

describe('AugmentedResultList', () => {
    let sandbox: sinon.SinonSandbox;

    let componentSetup: Mock.IBasicComponentSetup<AugmentedResultList>;
    let element: HTMLElement;
    let testOptions: Mock.AdvancedComponentSetupOptions;

    const objectData = [
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

    const returnData: IPromiseReturnArgs = {
        data: {
            objectData,
            commonData,
        },
    };

    const matchingIdField = '@id';

    const stubObjectAction = (objectIds: string[]): Promise<IPromiseReturnArgs> => {
        return Promise.resolve(returnData);
    };

    const createFakeResultsThatMatch = (numResults: number) => {
        const fakeResults = Fake.createFakeResults(numResults);
        fakeResults.results.forEach((result, index) => (result.raw.id = `#00${index}`));
        return fakeResults;
    };

    const createComponent = (objectDataAction?: (objectIds: string[]) => Promise<IPromiseReturnArgs>) => {
        element = document.createElement('div');
        document.body.append(element);
        testOptions = new Mock.AdvancedComponentSetupOptions(element, {
            matchingIdField,
            objectDataAction,
        });

        componentSetup = Mock.advancedComponentSetup(AugmentedResultList, testOptions);
        return componentSetup;
    };

    const verifyAugmentedObjectData = (objectData: any, results: IQueryResult[]) => {
        objectData.forEach((object: any) => {
            const matchingResult = results.find((result) => result.raw.id === (object as any).id);
            if (matchingResult) {
                for (const key in object) {
                    expect(matchingResult.raw[key]).toEqual(object[key]);
                }
            }
        });
    };

    const verifyUntouchedResults = (objectData: {}[], results: IQueryResult[]) => {
        const idString = matchingIdField.replace('@', '');

        objectData.forEach((object: any) => {
            const ids = objectData.map((data: any) => (data as any)[idString]);
            const otherResults = results.filter((result) => !ids.find((id) => (result as any)[idString] === id));

            otherResults.forEach((result: IQueryResult) => {
                for (const key in object) {
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

    const verifyAugmentedResults = (returnData: IPromiseReturnArgs, results: IQueryResult[]) => {
        verifyAugmentedObjectData(returnData.data.objectData, results);
        verifyAugmentedCommonData(returnData.data.commonData, results);
        verifyUntouchedResults(returnData.data.objectData, results);
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
        const test = createComponent(stubObjectAction);

        test.cmp.buildResults(data).then(() => {
            expect(test.cmp.getDisplayedResults().length).toEqual(numResults);
            verifyAugmentedResults(returnData, test.cmp.getDisplayedResults());
            done();
        });
    });

    it("should NOT augment results if IDs don't match", (done) => {
        const numResults = 10;
        const data = Fake.createFakeResults(numResults);
        const test = createComponent(stubObjectAction);

        test.cmp.buildResults(data).then(() => {
            expect(test.cmp.getDisplayedResults().length).toEqual(numResults);
            verifyAugmentedResults(returnData, test.cmp.getDisplayedResults());
            done();
        });
    });

    it('should still build results without augmenting if objectDataAction is missing', (done) => {
        const numResults = 10;
        const data = createFakeResultsThatMatch(numResults);
        const test = createComponent();

        test.cmp.buildResults(data).then(() => {
            expect(test.cmp.getDisplayedResults().length).toEqual(numResults);
            expect(test.cmp.getDisplayedResults()).toEqual(data.results);
            done();
        });
    });
});
