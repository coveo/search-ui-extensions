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

    it('should be hidden by defaut', () => {
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

    it('should hide itself whenever a query is made', () => {
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
            expect(mock.cmp.element.querySelector<HTMLElement>('.coveo-no-actions')).not.toBeNull();
            expect(mock.cmp.element.querySelector<HTMLElement>('.coveo-no-actions').innerText).toBe(l(`${UserActions.ID}_enable_prompt`));
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
        it('should show the component if the component is hidden', () => {
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

        it('should hide the component if the component is shown', () => {
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

        it('should show the component if the component is hidden', () => {
            mock.cmp.hide();
            mock.cmp.show();

            return delay(() => {
                expect(mock.cmp.root.className).toMatch('coveo-user-actions-opened');
            });
        });

        it('should do nothing if the component is shown', () => {
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

        it('should hide the component if the component is shown', () => {
            mock.cmp.show();
            mock.cmp.hide();

            return delay(() => {
                expect(mock.cmp.root.className).not.toMatch('coveo-user-actions-opened');
            });
        });

        it('should do nothing if the component is hidden', () => {
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
        let resultElementRow: HTMLElement;
        let resultElementCol: HTMLElement;
        let viewedByCustomerOption: Boolean;

        beforeEach(() => {
            result = Fake.createFakeResult();

            resultElementRow = document.createElement('div');
            resultElementRow.classList.add('coveo-result-row');

            resultElementCol = document.createElement('div');
            resultElementCol.classList.add('coveo-result-cell');

            resultElementRow.appendChild(resultElementCol);
        });

        describe('if the viewedByCustomer option is true', () => {
            beforeEach(() => {
                viewedByCustomerOption = true;
            });

            it('should add a ViewedByCustomer Component', () => {
                const mock = Mock.advancedComponentSetup<UserActions>(
                    UserActions,
                    new Mock.AdvancedComponentSetupOptions(null, { userId: 'testUserId', viewedByCustomer: viewedByCustomerOption }, env => {
                        fakeUserProfileModel(env.root, sandbox).getActions.returns(new Promise(() => {}));
                        return env;
                    })
                );

                const resultArgs = { result: result, item: resultElementRow };
                Coveo.$$(mock.env.root).trigger(ResultListEvents.newResultDisplayed, resultArgs);

                return delay(() => {
                    expect(mock.cmp.options.viewedByCustomer).toBe(true);
                    expect(resultElementRow.getElementsByClassName('CoveoViewedByCustomer').length).toBe(1);
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

                resultElementRow.querySelector('.coveo-result-cell').classList.add('CoveoViewedByCustomer');

                const resultArgs = { result: result, item: resultElementRow };
                Coveo.$$(mock.env.root).trigger(ResultListEvents.newResultDisplayed, resultArgs);

                return delay(() => {
                    expect(resultElementRow.getElementsByClassName('CoveoViewedByCustomer').length).toBe(1);
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

                const resultArgs = { result: result, item: resultElementRow };
                Coveo.$$(mock.env.root).trigger(ResultListEvents.newResultDisplayed, resultArgs);

                return delay(() => {
                    expect(mock.cmp.options.viewedByCustomer).toBe(false);
                    expect(resultElementRow.getElementsByClassName('CoveoViewedByCustomer').length).toBe(0);
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

                resultElementRow.querySelector('.coveo-result-cell').classList.add('CoveoViewedByCustomer');

                expect(resultElementRow.getElementsByClassName('CoveoViewedByCustomer').length).toBe(1);

                const resultArgs = { result: result, item: resultElementRow };
                Coveo.$$(mock.env.root).trigger(ResultListEvents.newResultDisplayed, resultArgs);

                return delay(() => {
                    expect(resultElementRow.getElementsByClassName('CoveoViewedByCustomer').length).toBe(1);
                });
            });
        });
    });
});
