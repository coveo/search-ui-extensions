import { Mock, Fake, Simulate } from 'coveo-search-ui-tests';
import { UserActions } from '../../../src/components/UserActions/UserActions';
import { Logger, Initialization, QueryEvents, ResultListEvents, IQueryResult, l } from 'coveo-search-ui';
import { createSandbox, SinonSandbox, SinonStub, SinonStubbedInstance } from 'sinon';
import { UserAction, UserProfileModel } from '../../../src/models/UserProfileModel';
import { delay, fakeUserProfileModel } from '../../utils';
import { ClickedDocumentList, QueryList, UserActivity } from '../../../src/Index';
import { UserActionType } from '../../../src/rest/UserProfilingEndpoint';
import { ResponsiveUserActions } from '../../../src/components/UserActions/ResponsiveUserActions';
import '../../../src/components/UserActions/Strings';

describe('UserActions', () => {
    let sandbox: SinonSandbox;

    const ACTIONS = [
        new UserAction(UserActionType.Search, new Date('2:00:00 AM'), {
            origin_level_1: 'not relevant' + Math.random(),
            query_expression: 'not relevant',
            cause: 'interfaceLoad'
        }),
        new UserAction(UserActionType.PageView, new Date('2:10:00 AM'), {
            origin_level_1: 'not relevant' + Math.random(),
            content_id_key: '@sysurihash',
            content_id_value: 'product1'
        }),
        new UserAction(UserActionType.Custom, new Date('2:20:00 AM'), {
            origin_level_1: 'not relevant' + Math.random(),
            c_contentidkey: '@sysurihash',
            c_contentidvalue: 'headphones-gaming',
            event_type: 'addPurchase',
            event_value: 'headphones-gaming'
        }),
        new UserAction(UserActionType.Custom, new Date('2:30:00 AM'), {
            origin_level_1: 'relevant' + Math.random(),
            c_contentidkey: '@sysurihash',
            c_contentidvalue: 'headphones-gaming',
            event_type: 'addPurchase',
            event_value: 'headphones-gaming'
        })
    ];

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

    it('should disable itself when the userId is falsy', () => {
        const responsiveComponentStub = sandbox.stub(ResponsiveUserActions, 'init');
        let getActionStub: SinonStub<[HTMLElement, UserActions], void>;

        const mock = Mock.advancedComponentSetup<UserActions>(
            UserActions,
            new Mock.AdvancedComponentSetupOptions(null, { userId: '' }, env => {
                getActionStub = fakeUserProfileModel(env.root, sandbox).getActions;
                return env;
            })
        );

        return delay(() => {
            expect(getActionStub.called).toBe(false);
            expect(responsiveComponentStub.called).toBe(false);
            expect(mock.cmp.disabled).toBe(true);
        });
    });

    it('should not be displayed if hidden option is true', () => {
        const responsiveComponentStub = sandbox.stub(ResponsiveUserActions, 'init');
        const hideSpy = sandbox.spy(UserActions.prototype, 'hide');

        Mock.advancedComponentSetup<UserActions>(
            UserActions,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId', hidden: true }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(ACTIONS));
                return env;
            })
        );

        return delay(() => {
            expect(hideSpy.called).toBe(false);
            expect(responsiveComponentStub.called).toBe(false);
        });
    });

    it('should register to the ResponsiveComponentManager by default', () => {
        const responsiveComponentStub = sandbox.stub(ResponsiveUserActions, 'init');

        Mock.advancedComponentSetup<UserActions>(
            UserActions,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(ACTIONS));
                return env;
            })
        );

        return delay(() => {
            expect(responsiveComponentStub.called).toBe(true);
        });
    });

    it('should not register to the ResponsiveComponentManager when useResponsiveManager is false', () => {
        const responsiveComponentStub = sandbox.stub(ResponsiveUserActions, 'init');

        Mock.advancedComponentSetup<UserActions>(
            UserActions,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId', useResponsiveManager: false }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(ACTIONS));
                return env;
            })
        );

        return delay(() => {
            expect(responsiveComponentStub.called).toBe(false);
        });
    });

    it('should be collapsed by defaut', () => {
        sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

        const mock = Mock.advancedComponentSetup<UserActions>(
            UserActions,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(ACTIONS));
                return env;
            })
        );

        return delay(() => {
            expect(mock.cmp.element.classList).not.toContain('coveo-user-actions-opened');
        });
    });

    it('should show a panel that has as title "Session Summary"', () => {
        sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

        const mock = Mock.advancedComponentSetup<UserActions>(
            UserActions,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(ACTIONS));
                return env;
            })
        );
        mock.cmp.show();

        return delay(() => {
            expect(mock.cmp.element.querySelector<HTMLElement>('.coveo-summary .coveo-accordion-header-title').innerText).toBe('Session Summary');
        });
    });

    it('should show a summary section that have a ClickedDocumentList and a Queries component', () => {
        const automaticallyCreateComponentsInsideStub = sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

        const mock = Mock.advancedComponentSetup<UserActions>(
            UserActions,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(ACTIONS));
                return env;
            })
        );
        mock.cmp.show();

        return delay(() => {
            const summarySection = mock.cmp.element.querySelector('.coveo-summary');

            expect(automaticallyCreateComponentsInsideStub.called).toBe(true);
            expect(summarySection.querySelector(`.Coveo${ClickedDocumentList.ID}`)).not.toBeNull();
            expect(summarySection.querySelector(`.Coveo${QueryList.ID}`)).not.toBeNull();
        });
    });

    it('should show a user activity section that have a UserActivity component', () => {
        const automaticallyCreateComponentsInsideStub = sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

        const mock = Mock.advancedComponentSetup<UserActions>(
            UserActions,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(ACTIONS));
                return env;
            })
        );
        mock.cmp.show();

        return delay(() => {
            const detailSection = mock.cmp.element.querySelector('.coveo-details');

            expect(automaticallyCreateComponentsInsideStub.called).toBe(true);
            expect(detailSection.querySelector<HTMLElement>('.coveo-accordion-header-title').innerText).toBe("User's Recent Activity");
            expect(detailSection.querySelector('.CoveoUserActivity')).not.toBeNull();
        });
    });

    it('should pass the user id option to each of it sub components', () => {
        const FAKE_USER_ID = 'someUserId' + Math.random();

        const automaticallyCreateComponentsInsideStub = sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

        Mock.advancedComponentSetup<UserActions>(
            UserActions,
            new Mock.AdvancedComponentSetupOptions(null, { userId: FAKE_USER_ID }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(ACTIONS));
                return env;
            })
        ).cmp.show();

        return delay(() => {
            expect(automaticallyCreateComponentsInsideStub.called).toBe(true);

            [ClickedDocumentList.ID, QueryList.ID, UserActivity.ID].forEach(component => {
                expect(automaticallyCreateComponentsInsideStub.args[0][1].options[component]).toBeDefined();
                expect(automaticallyCreateComponentsInsideStub.args[0][1].options[component].userId).toBe(FAKE_USER_ID);
            });
        });
    });

    it('should pass custom init options to each of the sub components', () => {
        const FAKE_USER_ID = 'someUserId' + Math.random();
        const initOptions = {
            QueryList: {
                listLabel: 'Custom Query List Title',
                numberOfItems: 1
            },
            ClickedDocumentList: {
                listLabel: 'Custom Clicked Document List Title',
                template: 'Custom Template',
                numberOfItems: 2
            },
            UserActivity: {
                unfoldInclude: ['includedField'],
                unfoldExclude: ['excludedField']
            }
        } as { [key: string]: any };

        const automaticallyCreateComponentsInsideStub = sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

        const component: UserActions = Mock.advancedComponentSetup<UserActions>(
            UserActions,
            new Mock.AdvancedComponentSetupOptions(null, { userId: FAKE_USER_ID }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(ACTIONS));
                return env;
            })
        ).cmp;

        component.searchInterface.options.originalOptionsObject = initOptions;
        component.show();

        return delay(() => {
            expect(automaticallyCreateComponentsInsideStub.called).toBe(true);

            const actualInitOptions = automaticallyCreateComponentsInsideStub.args[0][1].options;

            [QueryList.ID, ClickedDocumentList.ID, UserActivity.ID].forEach(component => {
                const actualComponentOptions = actualInitOptions[component];
                expect(actualComponentOptions).toBeDefined();
                expect(actualComponentOptions).toEqual(jasmine.objectContaining(initOptions[component]));
            });
        });
    });

    it('should collapse itself whenever a query is made', () => {
        sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

        const mock = Mock.advancedComponentSetup<UserActions>(
            UserActions,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(ACTIONS));
                return env;
            })
        );
        mock.cmp.show();

        const hideSpy = sandbox.spy(mock.cmp, 'hide');

        mock.env.root.dispatchEvent(new CustomEvent(QueryEvents.newQuery));

        expect(hideSpy.called).toBe(true);
    });

    it('should show a message when user actions is not enabled', () => {
        sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

        const mock = Mock.advancedComponentSetup<UserActions>(
            UserActions,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.reject({ statusCode: 404 }));
                return env;
            })
        );
        mock.cmp.show();

        return delay(() => {
            expect(mock.cmp.element.querySelector<HTMLElement>('.coveo-enable-prompt')).not.toBeNull();
            expect(mock.cmp.element.querySelector<HTMLElement>('.coveo-enable-prompt').innerText).toBe(
                l(`${UserActions.ID}_enable_prompt`).replace('\n', '')
            );
        });
    });

    it('should show a message when no actions are available', () => {
        sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

        const mock = Mock.advancedComponentSetup<UserActions>(
            UserActions,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve([]));
                return env;
            })
        );
        mock.cmp.show();

        return delay(() => {
            expect(mock.cmp.element.querySelector<HTMLElement>('.coveo-no-actions')).not.toBeNull();
            expect(mock.cmp.element.querySelector<HTMLElement>('.coveo-no-actions').innerText).toBe(l(`${UserActions.ID}_no_actions`));
        });
    });

    it('should show a message when actions cannot be gathered', () => {
        sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

        const mock = Mock.advancedComponentSetup<UserActions>(
            UserActions,
            new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, env => {
                fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.reject());
                return env;
            })
        );
        mock.cmp.show();

        return delay(() => {
            expect(mock.cmp.element.querySelector<HTMLElement>('.coveo-no-actions').innerText).toBe(l(`${UserActions.ID}_no_actions`));
        });
    });

    describe('when the accordion header is clicked', () => {
        it('should fold the accordion section when the accordion section is open', () => {
            const automaticallyCreateComponentsInsideStub = sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

            const mock = Mock.advancedComponentSetup<UserActions>(
                UserActions,
                new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, env => {
                    fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(ACTIONS));
                    return env;
                })
            );
            mock.cmp.show();

            return delay(() => {
                const accordionSections = mock.cmp.element.querySelectorAll('.coveo-accordion');
                expect(automaticallyCreateComponentsInsideStub.called).toBe(true);

                accordionSections.forEach(el => {
                    el.classList.remove('coveo-folded');
                    el.querySelector<HTMLElement>('.coveo-accordion-header').click();
                    expect(el.classList).toContain('coveo-folded');
                });
            });
        });

        it('should unfold the accordion section when the accordion section is closed', () => {
            const automaticallyCreateComponentsInsideStub = sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

            const mock = Mock.advancedComponentSetup<UserActions>(
                UserActions,
                new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, env => {
                    fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.resolve(ACTIONS));
                    return env;
                })
            );
            mock.cmp.show();

            return delay(() => {
                const accordionSections = mock.cmp.element.querySelectorAll('.coveo-accordion');

                expect(automaticallyCreateComponentsInsideStub.called).toBe(true);

                accordionSections.forEach(el => {
                    el.classList.add('coveo-folded');
                    el.querySelector<HTMLElement>('.coveo-accordion-header').click();
                    expect(el.classList).not.toContain('coveo-folded');
                });
            });
        });
    });

    describe('toggle', () => {
        it('should open the panel if its not already opened', () => {
            sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

            const mock = Mock.advancedComponentSetup<UserActions>(
                UserActions,
                new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, env => {
                    fakeUserProfileModel(env.root, sandbox).getActions.returns(new Promise(() => {}));
                    return env;
                })
            );

            mock.cmp.hide();

            mock.cmp.toggle();

            return delay(() => {
                expect(mock.cmp.root.className).toMatch('coveo-user-actions-opened');
            });
        });

        it('should collapse the panel if the panel is already opened', () => {
            sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

            const mock = Mock.advancedComponentSetup<UserActions>(
                UserActions,
                new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, env => {
                    fakeUserProfileModel(env.root, sandbox).getActions.returns(new Promise(() => {}));
                    return env;
                })
            );

            mock.cmp.show();

            mock.cmp.toggle();

            return delay(() => {
                expect(mock.cmp.root.className).not.toMatch('coveo-user-actions-opened');
            });
        });
    });

    describe('show', () => {
        let modelMock: SinonStubbedInstance<UserProfileModel>;
        let mock: Mock.IBasicComponentSetup<UserActions>;
        const someUserId = 'testuserId';

        beforeEach(() => {
            sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

            mock = Mock.advancedComponentSetup<UserActions>(
                UserActions,
                new Mock.AdvancedComponentSetupOptions(null, { userId: someUserId }, env => {
                    modelMock = fakeUserProfileModel(env.root, sandbox);
                    modelMock.getActions.returns(new Promise(() => {}));
                    return env;
                })
            );

            sandbox.resetHistory();
        });

        it('should open the panel if it is not already opened', () => {
            mock.cmp.hide();
            mock.cmp.show();

            return delay(() => {
                expect(mock.cmp.root.className).toMatch('coveo-user-actions-opened');
            });
        });

        it('should do nothing if the panel is already opened', () => {
            mock.cmp.show();

            const domMutation = sandbox.stub();
            const observer = new MutationObserver(domMutation);
            observer.observe(mock.cmp.element, { childList: true, subtree: true, attributes: true });

            mock.cmp.show();

            return delay(() => {
                expect(domMutation.called).toBe(false);
                expect(mock.cmp.root.className).toMatch('coveo-user-actions-opened');
            }).finally(() => {
                observer.disconnect();
            });
        });

        it('should fetch all user actions', () => {
            mock.cmp.show();

            return delay(() => {
                expect(modelMock.getActions.calledWithExactly(someUserId)).toBe(true);
            });
        });

        it('should trigger a userActionsShow event', () => {
            const spyDispatchEvent = sandbox.spy(mock.cmp.element, 'dispatchEvent');
            mock.cmp.show();

            expect(spyDispatchEvent.calledOnceWith(new CustomEvent('userActionsPanelHide')));
        });
    });

    describe('hide', () => {
        let modelMock: SinonStubbedInstance<UserProfileModel>;
        let mock: Mock.IBasicComponentSetup<UserActions>;
        const someUserId = 'testuserId';

        beforeEach(() => {
            sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

            mock = Mock.advancedComponentSetup<UserActions>(
                UserActions,
                new Mock.AdvancedComponentSetupOptions(null, { userId: someUserId }, env => {
                    modelMock = fakeUserProfileModel(env.root, sandbox);
                    modelMock.getActions.returns(new Promise(() => {}));
                    return env;
                })
            );

            sandbox.resetHistory();
        });

        it('should collapse the panel if the panel is opened', () => {
            mock.cmp.show();
            mock.cmp.hide();

            return delay(() => {
                expect(mock.cmp.root.className).not.toMatch('coveo-user-actions-opened');
            });
        });

        it('should do nothing if the panel is not opened', () => {
            mock.cmp.hide();

            const domMutation = sandbox.stub();
            const observer = new MutationObserver(domMutation);
            observer.observe(mock.cmp.element, { childList: true, subtree: true, attributes: true });

            // Scenario.
            mock.cmp.hide();

            // Tests.
            return delay(() => {
                expect(domMutation.called).toBe(false);
                expect(mock.cmp.root.className).not.toMatch('coveo-user-actions-opened');
            }).finally(() => {
                observer.disconnect();
            });
        });

        it('should remove all user actions', () => {
            mock.cmp.show();
            mock.cmp.hide();

            return delay(() => {
                expect(modelMock.deleteActions.calledWithExactly(someUserId)).toBe(true);
            });
        });

        it('should trigger a userActionsHide event', () => {
            mock.cmp.show();
            const spyDispatchEvent = sandbox.spy(mock.cmp.element, 'dispatchEvent');

            mock.cmp.hide();

            expect(spyDispatchEvent.calledOnceWith(new CustomEvent('userActionsPanelHide')));
        });
    });

    describe('tagViewsOfUser', () => {
        it('should add email to query', () => {
            const mock = Mock.advancedComponentSetup<UserActions>(
                UserActions,
                new Mock.AdvancedComponentSetupOptions(null, { userId: 'testUserId' }, env => {
                    fakeUserProfileModel(env.root, sandbox).getActions.returns(new Promise(() => {}));
                    return env;
                })
            );

            let queryData = Simulate.query(mock.env);

            const queryArgs = { e: 'error', args: queryData };
            Coveo.$$(mock.env.root).trigger('buildingQuery', queryArgs);

            return delay(() => {
                expect(queryData.queryBuilder.userActions.tagViewsOfUser).toBe('testUserId');
            });
        });

        it('should catch error', () => {
            const mock = Mock.advancedComponentSetup<UserActions>(
                UserActions,
                new Mock.AdvancedComponentSetupOptions(null, { userId: 'testUserId', record: undefined }, env => {
                    fakeUserProfileModel(env.root, sandbox).getActions.returns(new Promise(() => {}));
                    return env;
                })
            );
            const loggerSpy = sandbox.spy(Logger.prototype, 'warn');
            let queryData = Simulate.query(mock.env);

            const queryArgs = { e: 'error', args: queryData };
            Coveo.$$(mock.env.root).trigger('buildingQuery', queryArgs);

            return delay(() => {
                expect(loggerSpy.called).toBe(true);
            });
        });
    });

    describe('ViewedByCustomer', () => {
        let result: IQueryResult;
        let resultElementFrame: HTMLElement;
        let resultElementRow: HTMLElement;
        let resultElementCol: HTMLElement;
        let viewedByCustomerOption: Boolean;

        beforeEach(() => {
            result = Fake.createFakeResult();

            resultElementFrame = document.createElement('div');
            resultElementFrame.classList.add('coveo-result-frame');

            resultElementRow = document.createElement('div');
            resultElementRow.classList.add('coveo-result-row');

            resultElementCol = document.createElement('div');
            resultElementCol.classList.add('coveo-result-cell');

            resultElementRow.appendChild(resultElementCol);
            resultElementFrame.appendChild(resultElementRow);
        });

        describe('if the viewedByCustomer option is true', () => {
            const setResultList = (el: HTMLElement, layout: 'list' | 'card' | 'table') => {
                ['list', 'card', 'table'].forEach(key => {
                    const resultList = document.createElement('div');
                    resultList.classList.add('CoveoResultList');
                    if (key !== layout) {
                        resultList.classList.add('coveo-hidden');
                    }
                    resultList.dataset.layout = key;
                    el.appendChild(resultList);
                });
            };

            beforeEach(() => {
                viewedByCustomerOption = true;
            });

            it('should add a ViewedByCustomer Component when the result list layout is card', () => {
                const mock = Mock.advancedComponentSetup<UserActions>(
                    UserActions,
                    new Mock.AdvancedComponentSetupOptions(null, { userId: 'testUserId', viewedByCustomer: viewedByCustomerOption }, env => {
                        setResultList(env.root, 'card');
                        fakeUserProfileModel(env.root, sandbox).getActions.returns(new Promise(() => {}));
                        return env;
                    })
                );

                const resultArgs = { result: result, item: resultElementFrame };
                Coveo.$$(mock.env.root).trigger(ResultListEvents.newResultDisplayed, resultArgs);

                return delay(() => {
                    expect(mock.cmp.options.viewedByCustomer).toBe(true);
                    expect(resultElementFrame.getElementsByClassName('CoveoViewedByCustomer').length).toBe(1);
                });
            });

            it('should add a ViewedByCustomer Component when the result list layout is list', () => {
                const mock = Mock.advancedComponentSetup<UserActions>(
                    UserActions,
                    new Mock.AdvancedComponentSetupOptions(null, { userId: 'testUserId', viewedByCustomer: viewedByCustomerOption }, env => {
                        setResultList(env.root, 'list');
                        fakeUserProfileModel(env.root, sandbox).getActions.returns(new Promise(() => {}));
                        return env;
                    })
                );

                const resultArgs = { result: result, item: resultElementFrame };
                Coveo.$$(mock.env.root).trigger(ResultListEvents.newResultDisplayed, resultArgs);

                return delay(() => {
                    expect(mock.cmp.options.viewedByCustomer).toBe(true);
                    expect(resultElementFrame.getElementsByClassName('CoveoViewedByCustomer').length).toBe(1);
                });
            });

            it('should not add a ViewedByCustomer Component when the result list layout is table', () => {
                const mock = Mock.advancedComponentSetup<UserActions>(
                    UserActions,
                    new Mock.AdvancedComponentSetupOptions(null, { userId: 'testUserId', viewedByCustomer: viewedByCustomerOption }, env => {
                        setResultList(env.root, 'table');
                        fakeUserProfileModel(env.root, sandbox).getActions.returns(new Promise(() => {}));
                        return env;
                    })
                );

                const resultArgs = { result: result, item: resultElementFrame };
                Coveo.$$(mock.env.root).trigger(ResultListEvents.newResultDisplayed, resultArgs);

                return delay(() => {
                    expect(mock.cmp.options.viewedByCustomer).toBe(true);
                    expect(resultElementFrame.getElementsByClassName('CoveoViewedByCustomer').length).toBe(0);
                });
            });

            it('It should not add a viewedByCustomer if one is already there', () => {
                const mock = Mock.advancedComponentSetup<UserActions>(
                    UserActions,
                    new Mock.AdvancedComponentSetupOptions(null, { userId: 'testUserId', viewedByCustomer: viewedByCustomerOption }, env => {
                        fakeUserProfileModel(env.root, sandbox).getActions.returns(new Promise(() => {}));
                        return env;
                    })
                );

                resultElementFrame.querySelector('.coveo-result-cell').classList.add('CoveoViewedByCustomer');

                const resultArgs = { result: result, item: resultElementFrame };
                Coveo.$$(mock.env.root).trigger(ResultListEvents.newResultDisplayed, resultArgs);

                return delay(() => {
                    expect(resultElementFrame.getElementsByClassName('CoveoViewedByCustomer').length).toBe(1);
                });
            });
        });

        describe('if the viewedByCustomer option is false', () => {
            beforeEach(() => {
                viewedByCustomerOption = false;
            });

            it('should not add a ViewedByCustomer Component', () => {
                const mock = Mock.advancedComponentSetup<UserActions>(
                    UserActions,
                    new Mock.AdvancedComponentSetupOptions(null, { userId: 'testUserId', viewedByCustomer: viewedByCustomerOption }, env => {
                        fakeUserProfileModel(env.root, sandbox).getActions.returns(new Promise(() => {}));
                        return env;
                    })
                );

                const resultArgs = { result: result, item: resultElementFrame };
                Coveo.$$(mock.env.root).trigger(ResultListEvents.newResultDisplayed, resultArgs);

                return delay(() => {
                    expect(mock.cmp.options.viewedByCustomer).toBe(false);
                    expect(resultElementFrame.getElementsByClassName('CoveoViewedByCustomer').length).toBe(0);
                });
            });

            it('It should not add a viewedByCustomer if one is already there', () => {
                const mock = Mock.advancedComponentSetup<UserActions>(
                    UserActions,
                    new Mock.AdvancedComponentSetupOptions(null, { userId: 'testUserId', viewedByCustomer: viewedByCustomerOption }, env => {
                        fakeUserProfileModel(env.root, sandbox).getActions.returns(new Promise(() => {}));
                        return env;
                    })
                );

                resultElementFrame.querySelector('.coveo-result-cell').classList.add('CoveoViewedByCustomer');

                expect(resultElementFrame.getElementsByClassName('CoveoViewedByCustomer').length).toBe(1);

                const resultArgs = { result: result, item: resultElementFrame };
                Coveo.$$(mock.env.root).trigger(ResultListEvents.newResultDisplayed, resultArgs);

                return delay(() => {
                    expect(resultElementFrame.getElementsByClassName('CoveoViewedByCustomer').length).toBe(1);
                });
            });
        });
    });
});
