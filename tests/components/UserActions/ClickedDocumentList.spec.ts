import { createSandbox, SinonSandbox } from 'sinon';
import { Mock, Fake } from 'coveo-search-ui-tests';
import { ClickedDocumentList } from '../../../src/components/UserActions/ClickedDocumentList';
import { UserProfileModel, UserAction } from '../../../src/models/UserProfileModel';
import { Logger, Initialization } from 'coveo-search-ui';
import { delay, generate, fakeUserProfileModel } from '../../utils';
import { UserActionType } from '../../../src/rest/UserProfilingEndpoint';

describe('ClickedDocumentList', () => {
    const TEST_CLICKS = generate(20, i => {
        const document = Fake.createFakeResult();
        return new UserAction(UserActionType.Click, new Date(i), { origin_level_1: 'foo', uri_hash: document.uri }, document);
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

    it('should show a text when there is no document clicked', () => {
        const mock = Mock.advancedComponentSetup<ClickedDocumentList>(
            ClickedDocumentList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve([]));
                return env;
            })
        );

        return delay(() => {
            const emptyElement = mock.cmp.element.querySelector<HTMLLIElement>('.coveo-empty');
            expect(emptyElement).not.toBeNull();
            expect(emptyElement.innerText).toBe('No document clicked by this user');
        });
    });

    it('should show "Documents Clicked" as title', () => {
        const mock = Mock.advancedComponentSetup<ClickedDocumentList>(
            ClickedDocumentList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(TEST_CLICKS));
                return env;
            })
        );

        return delay(() => {
            expect(mock.cmp.element.querySelector('.coveo-title').innerHTML).toMatch('Recent Clicked Documents');
        });
    });

    it('should show 4 documents by default', () => {
        sandbox.stub(Initialization, 'automaticallyCreateComponentsInsideResult');

        const mock = Mock.advancedComponentSetup<ClickedDocumentList>(
            ClickedDocumentList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(TEST_CLICKS));
                return env;
            })
        );

        return delay(() => {
            const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');

            expect(list.childElementCount).toBe(4);
        });
    });

    it('should show a number of documents equal to the "numberOfItems" option', () => {
        sandbox.stub(Initialization, 'automaticallyCreateComponentsInsideResult');

        const mock = Mock.advancedComponentSetup<ClickedDocumentList>(
            ClickedDocumentList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId', numberOfItems: 10 }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(TEST_CLICKS));
                return env;
            })
        );

        return delay(() => {
            const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');

            expect(list.childElementCount).toBe(10);
        });
    });

    it('should show all documents when expanded', () => {
        sandbox.stub(Initialization, 'automaticallyCreateComponentsInsideResult');

        const mock = Mock.advancedComponentSetup<ClickedDocumentList>(
            ClickedDocumentList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(TEST_CLICKS));
                return env;
            })
        );

        return delay(() => {
            const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');
            const button = mock.env.element.querySelector<HTMLButtonElement>('.coveo-more-less');
            button.click();

            return delay(() => {
                expect(list.childElementCount).toBe(TEST_CLICKS.length);
            });
        });
    });

    it('should render the a list of document clicked by a user as a list of ResultLink and put the most recent document click on top', () => {
        const createComponentInside = sandbox.stub(Initialization, 'automaticallyCreateComponentsInsideResult');

        const mock = Mock.advancedComponentSetup<ClickedDocumentList>(
            ClickedDocumentList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(TEST_CLICKS));
                return env;
            })
        );

        const sortedClick = TEST_CLICKS.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()).reverse();

        return delay(() => {
            const list = mock.env.element.querySelector<HTMLOListElement>('.coveo-list');

            list.childNodes.forEach((node: HTMLElement, i) => {
                expect(node.innerHTML).toMatch('CoveoResultLink');
                expect(createComponentInside.calledWith(node.firstChild as HTMLElement, sortedClick[i].document)).toBe(true);
            });
        });
    });

    it('should fetch the list of document clicked by a user from the model', () => {
        let model = sandbox.createStubInstance(UserProfileModel);

        Mock.advancedComponentSetup<ClickedDocumentList>(
            ClickedDocumentList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, env => {
                model = fakeUserProfileModel(env.root, sandbox);
                model.getActions.returns(Promise.resolve(TEST_CLICKS));
                return env;
            })
        );

        expect(model.getActions.called).toBe(true);
    });

    it("should log an error message when the component can't fetch the list of document clicked by a user from the model", () => {
        const errorLoggerStub = sandbox.stub(Logger.prototype, 'error');

        const mock = Mock.advancedComponentSetup<ClickedDocumentList>(
            ClickedDocumentList,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.reject());
                return env;
            })
        );

        return delay(() => {
            expect(mock.cmp.element.childElementCount).toBe(0);
            expect(errorLoggerStub.called).toBe(true);
        });
    });

    describe('template', () => {
        it('should use the given template in options', () => {
            sandbox.stub(Initialization, 'automaticallyCreateComponentsInsideResult');
            const instantiateToElementStub = sandbox.stub().returns(Promise.resolve(document.createElement('div')));

            Mock.advancedComponentSetup<ClickedDocumentList>(
                ClickedDocumentList,
                new Mock.AdvancedComponentSetupOptions(
                    null,
                    {
                        userId: 'testuserId',
                        max: TEST_CLICKS.length,
                        show: TEST_CLICKS.length,
                        template: {
                            instantiateToElement: instantiateToElementStub
                        }
                    },
                    env => {
                        fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(TEST_CLICKS));
                        return env;
                    }
                )
            );

            const sortedClick = TEST_CLICKS.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()).reverse();

            return delay(() => {
                expect(instantiateToElementStub.callCount).toBe(TEST_CLICKS.length);
                sortedClick.forEach((userAction, i) => {
                    expect(instantiateToElementStub.args[i][0]).toBe(userAction.document);
                });
            });
        });
    });
});
