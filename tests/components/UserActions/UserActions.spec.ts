import { Mock } from 'coveo-search-ui-tests';
import { UserActions } from '../../../src/components/UserActions/UserActions';
import { Logger, Initialization, QueryEvents } from 'coveo-search-ui';
import { createSandbox, SinonSandbox } from 'sinon';
import { UserProfileModel, UserAction } from '../../../src/models/UserProfileModel';
import { delay } from '../../utils';
import { InitializationUtils } from '../../../src/utils/initialization';
import { ClickedDocumentList, QueryList, UserActivity } from '../../../src/Index';
import { UserActionType } from '../../../src/rest/UserProfilingEndpoint';

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

    it('should be hidden by defaut', () => {
        const model = sandbox.createStubInstance(UserProfileModel);
        model.getActions.returns(Promise.resolve(ACTIONS));

        sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);
        sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

        const mock = Mock.basicComponentSetup<UserActions>(UserActions);

        return delay(() => {
            expect(mock.cmp.element.classList).not.toContain('coveo-user-actions-opened');
        });
    });

    it('should show a panel that has as title "Session Summary"', () => {
        const model = sandbox.createStubInstance(UserProfileModel);
        model.getActions.returns(Promise.resolve(ACTIONS));

        sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);
        sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

        const mock = Mock.basicComponentSetup<UserActions>(UserActions);
        mock.cmp.show();

        return delay(() => {
            expect(mock.cmp.element.querySelector<HTMLElement>('.coveo-summary .coveo-accordion-header-title').innerText).toBe('Session Summary');
        });
    });

    it('should show a summary section that have a ClickedDocumentList and a Queries component', () => {
        const model = sandbox.createStubInstance(UserProfileModel);
        model.getActions.returns(Promise.resolve(ACTIONS));

        sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

        const automaticallyCreateComponentsInsideStub = sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

        const mock = Mock.basicComponentSetup<UserActions>(UserActions);
        mock.cmp.show();

        return delay(() => {
            const summarySection = mock.cmp.element.querySelector('.coveo-summary');

            expect(automaticallyCreateComponentsInsideStub.called).toBe(true);
            expect(summarySection.querySelector(`.Coveo${ClickedDocumentList.ID}`)).not.toBeNull();
            expect(summarySection.querySelector(`.Coveo${QueryList.ID}`)).not.toBeNull();
        });
    });

    it('should show a user activity section that have a UserActivity component', () => {
        const model = sandbox.createStubInstance(UserProfileModel);
        model.getActions.returns(Promise.resolve(ACTIONS));

        sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

        const automaticallyCreateComponentsInsideStub = sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

        const mock = Mock.basicComponentSetup<UserActions>(UserActions);
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

        const model = sandbox.createStubInstance(UserProfileModel);
        model.getActions.returns(Promise.resolve(ACTIONS));

        sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

        const automaticallyCreateComponentsInsideStub = sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

        Mock.basicComponentSetup<UserActions>(UserActions, {
            userId: FAKE_USER_ID
        }).cmp.show();
        return delay(() => {
            expect(automaticallyCreateComponentsInsideStub.called).toBe(true);

            [ClickedDocumentList.ID, QueryList.ID, UserActivity.ID].forEach(component => {
                expect(automaticallyCreateComponentsInsideStub.args[0][1].options[component]).toBeDefined();
                expect(automaticallyCreateComponentsInsideStub.args[0][1].options[component].userId).toBe(FAKE_USER_ID);
            });
        });
    });

    it('should hide itself whenever a query is made', () => {
        const model = sandbox.createStubInstance(UserProfileModel);
        model.getActions.returns(Promise.resolve(ACTIONS));

        sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);
        sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

        const mock = Mock.basicComponentSetup<UserActions>(UserActions);
        mock.cmp.show();

        const hideSpy = sandbox.spy(mock.cmp, 'hide');

        mock.env.root.dispatchEvent(new CustomEvent(QueryEvents.newQuery));

        expect(hideSpy.called).toBe(true);
    });

    it('should show a message when no actions are available', () => {
        const model = sandbox.createStubInstance(UserProfileModel);
        model.getActions.returns(Promise.resolve([]));

        sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);
        sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

        const mock = Mock.basicComponentSetup<UserActions>(UserActions);
        mock.cmp.show();

        return delay(() => {
            expect(mock.cmp.element.querySelector<HTMLElement>('.coveo-no-actions')).not.toBeNull();
            expect(mock.cmp.element.querySelector<HTMLElement>('.coveo-no-actions').innerText).toBe('No actions available for this user');
        });
    });

    it('should show a message when actions cannot be gathered', () => {
        const model = sandbox.createStubInstance(UserProfileModel);
        model.getActions.returns(Promise.reject());

        sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);
        sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

        const mock = Mock.basicComponentSetup<UserActions>(UserActions);
        mock.cmp.show();

        return delay(() => {
            expect(mock.cmp.element.querySelector<HTMLElement>('.coveo-no-actions').innerText).toBe('No actions available for this user');
        });
    });

    describe('when the accordion header is clicked', () => {
        it('should fold the accordion section when the accordion section is open', () => {
            const model = sandbox.createStubInstance(UserProfileModel);
            model.getActions.returns(Promise.resolve(ACTIONS));

            sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

            const automaticallyCreateComponentsInsideStub = sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

            const mock = Mock.basicComponentSetup<UserActions>(UserActions);
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
            const model = sandbox.createStubInstance(UserProfileModel);
            model.getActions.returns(Promise.resolve(ACTIONS));

            sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);

            const automaticallyCreateComponentsInsideStub = sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

            const mock = Mock.basicComponentSetup<UserActions>(UserActions);
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
            const model = sandbox.createStubInstance(UserProfileModel);
            model.getActions.returns(new Promise(() => {}));

            sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);
            sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

            const mock = Mock.basicComponentSetup<UserActions>(UserActions);

            mock.cmp.hide();

            mock.cmp.toggle();

            return delay(() => {
                expect(mock.cmp.root.className).toMatch('coveo-user-actions-opened');
            });
        });

        it('should hide the component if the component is shown', () => {
            const model = sandbox.createStubInstance(UserProfileModel);
            model.getActions.returns(new Promise(() => {}));

            sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);
            sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

            const mock = Mock.basicComponentSetup<UserActions>(UserActions);

            mock.cmp.show();

            mock.cmp.toggle();

            return delay(() => {
                expect(mock.cmp.root.className).not.toMatch('coveo-user-actions-opened');
            });
        });
    });

    describe('show', () => {
        it('should show the component if the component is hidden', () => {
            const model = sandbox.createStubInstance(UserProfileModel);
            model.getActions.returns(new Promise(() => {}));

            sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);
            sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

            const mock = Mock.basicComponentSetup<UserActions>(UserActions);

            mock.cmp.hide();

            mock.cmp.show();

            return delay(() => {
                expect(mock.cmp.root.className).toMatch('coveo-user-actions-opened');
            });
        });

        it('should do nothing if the component is shown', () => {
            const model = sandbox.createStubInstance(UserProfileModel);
            model.getActions.returns(new Promise(() => {}));

            sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);
            sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

            const mock = Mock.basicComponentSetup<UserActions>(UserActions);

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
    });

    describe('hide', () => {
        it('should hide the component if the component is shown', () => {
            const model = sandbox.createStubInstance(UserProfileModel);
            model.getActions.returns(new Promise(() => {}));

            sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);
            sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

            const mock = Mock.basicComponentSetup<UserActions>(UserActions);

            mock.cmp.show();

            mock.cmp.hide();

            return delay(() => {
                expect(mock.cmp.root.className).not.toMatch('coveo-user-actions-opened');
            });
        });

        it('should do nothing if the component is hidden', () => {
            const model = sandbox.createStubInstance(UserProfileModel);
            model.getActions.returns(new Promise(() => {}));

            sandbox.stub(InitializationUtils, 'getUserProfileModel').returns((model as any) as UserProfileModel);
            sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

            const mock = Mock.basicComponentSetup<UserActions>(UserActions);

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
    });
});
