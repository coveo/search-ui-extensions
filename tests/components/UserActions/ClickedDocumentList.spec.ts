import { createSandbox, SinonSandbox, SinonStub } from 'sinon';
import { Mock, Fake } from 'coveo-search-ui-tests';
import { ClickedDocumentList } from '../../../src/components/UserActions/ClickedDocumentList';
import { UserProfileModel, UserAction } from '../../../src/models/UserProfileModel';
import { Logger, Initialization, ResultLink, NoopAnalyticsClient, QueryUtils } from 'coveo-search-ui';
import { generate, fakeUserProfileModel, waitForPromiseCompletion } from '../../utils';
import { UserActionType } from '../../../src/rest/UserProfilingEndpoint';
import { UserActionEvents } from '../../../src/components/UserActions/Events';

describe('ClickedDocumentList', () => {
    const BUILD_ACTION = (hash: string, i: number) => {
        const document = Fake.createFakeResult();
        document.uri = hash;
        return new UserAction(UserActionType.Click, new Date(i), { origin_level_1: 'foo', uri_hash: document.uri }, document);
    };

    const TEST_CLICKS = generate(20, (i) => {
        return BUILD_ACTION(`document${i}`, i);
    });

    let sandbox: SinonSandbox;

    beforeAll(() => {
        Logger.disable();
    });

    beforeEach(() => {
        sandbox = createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    afterAll(() => {
        Logger.enable();
    });

    it('should show a text when there is no document clicked', async () => {
        const mock = Mock.advancedComponentSetup<ClickedDocumentList>(
            ClickedDocumentList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, (env) => {
                fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.resolve([]));
                return env;
            })
        );
        await waitForPromiseCompletion();

        const emptyElement = mock.cmp.element.querySelector<HTMLLIElement>('.coveo-empty');
        expect(emptyElement).not.toBeNull();
        expect(emptyElement.innerText).toBe('No document clicked by this user');
    });

    it('should show "Documents Clicked" as title', async () => {
        const mock = Mock.advancedComponentSetup<ClickedDocumentList>(
            ClickedDocumentList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, (env) => {
                fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.resolve(TEST_CLICKS));
                return env;
            })
        );
        await waitForPromiseCompletion();

        expect(mock.cmp.element.querySelector('.coveo-title').innerHTML).toMatch('Recent Clicked Documents');
    });

    it('should show the title specified in "listLabel" option', async () => {
        const customTitle = 'Custom Title';
        const mock = Mock.advancedComponentSetup<ClickedDocumentList>(
            ClickedDocumentList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId', listLabel: customTitle }, (env) => {
                fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.resolve(TEST_CLICKS));
                return env;
            })
        );
        await waitForPromiseCompletion();

        expect(mock.cmp.element.querySelector('.coveo-title').innerHTML).toMatch(customTitle);
    });

    it('should show 4 documents by default', async () => {
        sandbox.stub(Initialization, 'automaticallyCreateComponentsInsideResult');

        const mock = Mock.advancedComponentSetup<ClickedDocumentList>(
            ClickedDocumentList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, (env) => {
                fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.resolve(TEST_CLICKS));
                return env;
            })
        );
        await waitForPromiseCompletion();

        const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');

        expect(list.childElementCount).toBe(4);
    });

    it('should show a number of documents equal to the "numberOfItems" option', async () => {
        sandbox.stub(Initialization, 'automaticallyCreateComponentsInsideResult');

        const mock = Mock.advancedComponentSetup<ClickedDocumentList>(
            ClickedDocumentList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId', numberOfItems: 10 }, (env) => {
                fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.resolve(TEST_CLICKS));
                return env;
            })
        );
        await waitForPromiseCompletion();

        const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');

        expect(list.childElementCount).toBe(10);
    });

    it('should display an icon beside every list item', async () => {
        sandbox.stub(Initialization, 'automaticallyCreateComponentsInsideResult');

        const mock = Mock.advancedComponentSetup<ClickedDocumentList>(
            ClickedDocumentList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId', numberOfItems: 10 }, (env) => {
                fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.resolve(TEST_CLICKS));
                return env;
            })
        );
        await waitForPromiseCompletion();

        const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');

        for (let i = 0; i < 4; i++) {
            const icon = list.children.item(i).querySelector<HTMLElement>('svg');
            expect(icon).toBeDefined;
        }
    });

    it('should show all documents when expanded', async () => {
        sandbox.stub(Initialization, 'automaticallyCreateComponentsInsideResult');

        const mock = Mock.advancedComponentSetup<ClickedDocumentList>(
            ClickedDocumentList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, (env) => {
                fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.resolve(TEST_CLICKS));
                return env;
            })
        );
        await waitForPromiseCompletion();

        const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');
        const button = mock.env.element.querySelector<HTMLButtonElement>('.coveo-more-less');
        button.click();

        await waitForPromiseCompletion();

        expect(list.childElementCount).toBe(TEST_CLICKS.length);
    });

    it('should not show the same query twice', async () => {
        // Setup.
        const createComponentInsideStub = sandbox.stub(Initialization, 'automaticallyCreateComponentsInsideResult');

        const CLICK_EVENTS = [
            BUILD_ACTION('someQuery', 4),
            BUILD_ACTION('someQuery2', 3),
            BUILD_ACTION('someQuery2', 2),
            BUILD_ACTION('someQuery2', 1),
            BUILD_ACTION('someQuery', 0),
        ];

        const SORTED_AND_TRIMMED_CLICK_EVENTS = [CLICK_EVENTS[0], CLICK_EVENTS[1]];

        const mock = Mock.advancedComponentSetup<ClickedDocumentList>(
            ClickedDocumentList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, (env) => {
                fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.resolve(CLICK_EVENTS));
                return env;
            })
        );
        await waitForPromiseCompletion();

        // Validation.
        const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');
        expect(list.childElementCount).toBe(SORTED_AND_TRIMMED_CLICK_EVENTS.length);

        // Check that the order is respected.
        list.childNodes.forEach((node: HTMLElement, i) => {
            expect(node.innerHTML).toMatch('CoveoResultLink');
            expect(createComponentInsideStub.calledWith(node.firstChild as HTMLElement, SORTED_AND_TRIMMED_CLICK_EVENTS[i].document)).toBe(true);
        });
    });

    it('should render the a list of document clicked by a user as a list of ResultLink and put the most recent document click on top', async () => {
        const createComponentInside = sandbox.stub(Initialization, 'automaticallyCreateComponentsInsideResult');

        const mock = Mock.advancedComponentSetup<ClickedDocumentList>(
            ClickedDocumentList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, (env) => {
                fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.resolve(TEST_CLICKS));
                return env;
            })
        );
        await waitForPromiseCompletion();

        const sortedClick = TEST_CLICKS.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()).reverse();

        const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');

        list.childNodes.forEach((node: HTMLElement, i) => {
            expect(node.innerHTML).toMatch('CoveoResultLink');
            expect(createComponentInside.calledWith(node.firstChild as HTMLElement, sortedClick[i].document)).toBe(true);
        });
    });

    it('should fetch the list of document clicked by a user from the model', async () => {
        let model = sandbox.createStubInstance(UserProfileModel);

        Mock.advancedComponentSetup<ClickedDocumentList>(
            ClickedDocumentList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, (env) => {
                model = fakeUserProfileModel(env.root, sandbox);
                model.getActions.callsFake(() => Promise.resolve(TEST_CLICKS));
                return env;
            })
        );
        await waitForPromiseCompletion();

        expect(model.getActions.called).toBe(true);
    });

    it("should log an error message when the component can't fetch the list of document clicked by a user from the model", async () => {
        const errorLoggerStub = sandbox.stub(Logger.prototype, 'error');

        const mock = Mock.advancedComponentSetup<ClickedDocumentList>(
            ClickedDocumentList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, (env) => {
                fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.reject());
                return env;
            })
        );
        await waitForPromiseCompletion();

        expect(mock.cmp.element.childElementCount).toBe(0);
        expect(errorLoggerStub.called).toBe(true);
    });

    it('Should disable itself when the userId is falsey', async () => {
        let getActionStub: SinonStub<[HTMLElement, ClickedDocumentList], void>;
        const mock = Mock.advancedComponentSetup<ClickedDocumentList>(
            ClickedDocumentList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: null }, (env) => {
                getActionStub = fakeUserProfileModel(env.root, sandbox).getActions;
                return env;
            })
        );
        await waitForPromiseCompletion();

        expect(getActionStub.called).toBe(false);
        expect(mock.cmp.disabled).toBe(true);
    });

    it('Should disable itself when the userId is empty string', async () => {
        let getActionStub: SinonStub<[HTMLElement, ClickedDocumentList], void>;
        const mock = Mock.advancedComponentSetup<ClickedDocumentList>(
            ClickedDocumentList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: '' }, (env) => {
                getActionStub = fakeUserProfileModel(env.root, sandbox).getActions;
                return env;
            })
        );
        await waitForPromiseCompletion();

        expect(getActionStub.called).toBe(false);
        expect(mock.cmp.disabled).toBe(true);
    });

    it('Should open the link in a new tab when alwaysOpenInNewWindow is true', async () => {
        let openLinkStub = sandbox.stub(ResultLink.prototype, 'openLink');
        let openInANewTabStub = sandbox.stub(ResultLink.prototype, 'openLinkInNewWindow');
        const mock = Mock.advancedComponentSetup<ClickedDocumentList>(
            ClickedDocumentList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, (env) => {
                fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.resolve(TEST_CLICKS));
                env.componentOptionsModel;
                env.usageAnalytics = new NoopAnalyticsClient();
                env.withResult();
                env.searchInterface.options.originalOptionsObject['ResultLink'] = {
                    ...env.searchInterface.options.originalOptionsObject['ResultLink'],
                };
                env.searchInterface.options.originalOptionsObject['ResultLink']['alwaysOpenInNewWindow'] = true;
                return env;
            })
        );

        await waitForPromiseCompletion();

        mock.env.element.querySelector<HTMLOListElement>('.coveo-list .CoveoResultLink').click();

        expect(openLinkStub.calledWith(false)).toBe(false);
        expect(openInANewTabStub.calledWith(false)).toBe(true);
    });

    it('Should not open the link in a new tab when alwaysOpenInNewWindow is false', async () => {
        let openLinkStub = sandbox.stub(ResultLink.prototype, 'openLink');
        let openInANewTabStub = sandbox.stub(ResultLink.prototype, 'openLinkInNewWindow');
        const mock = Mock.advancedComponentSetup<ClickedDocumentList>(
            ClickedDocumentList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, (env) => {
                fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.resolve(TEST_CLICKS));
                env.componentOptionsModel;
                env.usageAnalytics = new NoopAnalyticsClient();
                env.withResult();
                env.searchInterface.options.originalOptionsObject['ResultLink'] = {
                    ...env.searchInterface.options.originalOptionsObject['ResultLink'],
                };
                env.searchInterface.options.originalOptionsObject['ResultLink']['alwaysOpenInNewWindow'] = false;
                return env;
            })
        );

        await waitForPromiseCompletion();

        mock.env.element.querySelector<HTMLOListElement>('.coveo-list .CoveoResultLink').click();

        expect(openLinkStub.calledWith(false)).toBe(true);
        expect(openInANewTabStub.calledWith(false)).toBe(false);
    });

    it('should log a userActionDocumentClick event when a result link in the template is clicked', async () => {
        let openLinkStub = sandbox.stub(ResultLink.prototype, 'openLink');
        let logSearchStub: SinonStub;
        let logCustomStub: SinonStub;
        const mock = Mock.advancedComponentSetup<ClickedDocumentList>(
            ClickedDocumentList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, (env) => {
                fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.resolve(TEST_CLICKS));
                env.usageAnalytics = new NoopAnalyticsClient();
                env.withResult();
                logSearchStub = sandbox.stub(env.usageAnalytics, 'logSearchEvent');
                logCustomStub = sandbox.stub(env.usageAnalytics, 'logCustomEvent');
                return env;
            })
        );

        await waitForPromiseCompletion();

        mock.env.element.querySelector<HTMLOListElement>('.coveo-list .CoveoResultLink').click();

        expect(openLinkStub.calledWith(false)).toBe(true);
        expect(logSearchStub.called).toBeFalse;
        expect(
            logCustomStub.calledWith(
                UserActionEvents.documentClick,
                {
                    documentUrl: mock.env.result.clickUri,
                    documentTitle: mock.env.result.title,
                    sourceName: QueryUtils.getSource(mock.env.result),
                    author: QueryUtils.getAuthor(mock.env.result),
                },
                null,
                mock.env.result
            )
        ).toBeTrue;
    });

    describe('template', () => {
        it('should use the given template in options', async () => {
            sandbox.stub(Initialization, 'automaticallyCreateComponentsInsideResult');
            const instantiateToElementStub = sandbox.stub().callsFake(() => Promise.resolve(document.createElement('div')));

            Mock.advancedComponentSetup<ClickedDocumentList>(
                ClickedDocumentList,
                new Mock.AdvancedComponentSetupOptions(
                    null,
                    {
                        userId: 'testuserId',
                        max: TEST_CLICKS.length,
                        show: TEST_CLICKS.length,
                        template: {
                            instantiateToElement: instantiateToElementStub,
                        },
                    },
                    (env) => {
                        fakeUserProfileModel(env.root, sandbox).getActions.callsFake(() => Promise.resolve(TEST_CLICKS));
                        return env;
                    }
                )
            );
            await waitForPromiseCompletion();

            const sortedClick = TEST_CLICKS.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()).reverse();

            expect(instantiateToElementStub.callCount).toBe(TEST_CLICKS.length);
            sortedClick.forEach((userAction, i) => {
                expect(instantiateToElementStub.args[i][0]).toBe(userAction.document);
            });
        });
    });
});
