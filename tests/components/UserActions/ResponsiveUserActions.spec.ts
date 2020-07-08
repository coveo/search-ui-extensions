import { ResponsiveUserActions } from '../../../src/components/UserActions/ResponsiveUserActions';
import { Mock } from 'coveo-search-ui-tests';
import { UserActions } from '../../../src/components/UserActions/UserActions';
import { $$, ResponsiveComponentsManager, Initialization, ResponsiveDropdownHeader } from 'coveo-search-ui';
import { SinonSandbox, createSandbox } from 'sinon';
import { fakeUserProfileModel } from '../../utils';

describe('ResponsiveUserActions', () => {
    let sandbox: SinonSandbox;

    beforeAll(() => {
        sandbox = createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('init', () => {
        it('should register the UserAction component to the ResponsiveComponentManager', () => {
            const registerStub = sandbox.stub(ResponsiveComponentsManager, 'register');
            const userActions = {} as any;
            const env = new Mock.MockEnvironmentBuilder().build();

            ResponsiveUserActions.init(env.root, userActions);

            expect(registerStub.calledOnce).toBe(true);
            expect(registerStub.args[0]).toContain(userActions);
        });
    });

    describe('registerComponent', () => {
        it('should return true when the component is an instance of User Actions', () => {
            sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

            const userActions = Mock.advancedComponentSetup<UserActions>(
                UserActions,
                new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, (env) => {
                    fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.reject());
                    return env;
                })
            ).cmp;

            const responsiveUserActions = new ResponsiveUserActions($$('div'), UserActions.ID, {});

            expect(responsiveUserActions.registerComponent(userActions)).toBe(true);
        });

        it('should return false when the component is not an instance of User Actions', () => {
            const root = document.createElement('div');
            const responsiveUserActions = new ResponsiveUserActions($$(root), UserActions.ID, {});
            const component = { constructor: { ID: 'someID' } } as any;

            expect(responsiveUserActions.registerComponent(component)).toBe(false);
        });
    });

    describe('handleResizeEvent', () => {
        it('should append the user actions button in the Responsive Header Wrapper section', () => {
            sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

            const mock = Mock.advancedComponentSetup<UserActions>(
                UserActions,
                new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, (env) => {
                    fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.reject());
                    return env;
                })
            );

            const headerSection = document.createElement('div');
            headerSection.classList.add(ResponsiveComponentsManager.DROPDOWN_HEADER_WRAPPER_CSS_CLASS);
            mock.env.root.appendChild(headerSection);

            const responsiveUserActions = new ResponsiveUserActions($$(mock.env.root), UserActions.ID, {});

            responsiveUserActions.registerComponent(mock.cmp);

            expect(mock.env.root.querySelector(`a.${ResponsiveDropdownHeader.DEFAULT_CSS_CLASS_NAME}`)).toBeNull();

            responsiveUserActions.handleResizeEvent();

            expect(mock.env.root.querySelector(`a.${ResponsiveDropdownHeader.DEFAULT_CSS_CLASS_NAME}`)).not.toBeNull();
        });

        it('should not append the user actions button when the Responsive Header Wrapper is not available', () => {
            sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

            const mock = Mock.advancedComponentSetup<UserActions>(
                UserActions,
                new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, (env) => {
                    fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.reject());
                    return env;
                })
            );

            const responsiveUserActions = new ResponsiveUserActions($$(mock.env.root), UserActions.ID, {});

            responsiveUserActions.registerComponent(mock.cmp);

            expect(mock.env.root.querySelector(`a.${ResponsiveDropdownHeader.DEFAULT_CSS_CLASS_NAME}`)).toBeNull();

            responsiveUserActions.handleResizeEvent();

            expect(mock.env.root.querySelector(`a.${ResponsiveDropdownHeader.DEFAULT_CSS_CLASS_NAME}`)).toBeNull();
        });
    });

    describe('needDropdownWrapper', () => {
        it('should always respond true', () => {
            const env = new Mock.MockEnvironmentBuilder().build();
            const responsiveUserActions = new ResponsiveUserActions($$(env.root), UserActions.ID, {});

            expect(responsiveUserActions.needDropdownWrapper()).toBe(true);
        });
    });

    describe('user actions button', () => {
        it('should toggle the user actions panel when the button is clicked', () => {
            sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

            const mock = Mock.advancedComponentSetup<UserActions>(
                UserActions,
                new Mock.AdvancedComponentSetupOptions(null, { userId: 'testuserId' }, (env) => {
                    fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.reject());
                    return env;
                })
            );

            const headerSection = document.createElement('div');
            headerSection.classList.add(ResponsiveComponentsManager.DROPDOWN_HEADER_WRAPPER_CSS_CLASS);
            mock.env.root.appendChild(headerSection);

            const responsiveUserActions = new ResponsiveUserActions($$(mock.env.root), UserActions.ID, {});

            const toggleStub = sandbox.stub(mock.cmp, 'toggle');

            responsiveUserActions.registerComponent(mock.cmp);
            responsiveUserActions.handleResizeEvent();

            const button = mock.env.root.querySelector<HTMLElement>(`a.${ResponsiveDropdownHeader.DEFAULT_CSS_CLASS_NAME}`);
            button.click();

            expect(toggleStub.called).toBe(true);
        });

        it('should have the user action title as label', () => {
            const title = 'someTitle';
            sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

            const mock = Mock.advancedComponentSetup<UserActions>(
                UserActions,
                new Mock.AdvancedComponentSetupOptions(null, { userId: 'someId', buttonLabel: title }, (env) => {
                    fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.reject());
                    return env;
                })
            );
            const headerSection = document.createElement('div');
            headerSection.classList.add(ResponsiveComponentsManager.DROPDOWN_HEADER_WRAPPER_CSS_CLASS);
            mock.env.root.appendChild(headerSection);

            const responsiveUserActions = new ResponsiveUserActions($$(mock.env.root), UserActions.ID, {});

            responsiveUserActions.registerComponent(mock.cmp);
            responsiveUserActions.handleResizeEvent();

            const button = mock.env.root.querySelector<HTMLElement>(`a.${ResponsiveDropdownHeader.DEFAULT_CSS_CLASS_NAME}`);

            expect(button.innerHTML).toMatch(title);
        });

        it('should trigger a custom event that has "openUserActions" as name and "User Actions" as type', () => {
            sandbox.stub(Initialization, 'automaticallyCreateComponentsInside');

            const mock = Mock.advancedComponentSetup<UserActions>(
                UserActions,
                new Mock.AdvancedComponentSetupOptions(null, { userId: 'someId' }, (env) => {
                    fakeUserProfileModel(env.root, sandbox).getActions.returns(Promise.reject());
                    return env;
                })
            );

            const headerSection = document.createElement('div');
            headerSection.classList.add(ResponsiveComponentsManager.DROPDOWN_HEADER_WRAPPER_CSS_CLASS);
            mock.env.root.appendChild(headerSection);

            const responsiveUserActions = new ResponsiveUserActions($$(mock.env.root), UserActions.ID, {});

            const logCustomEventStub = sandbox.stub(mock.env.usageAnalytics, 'logCustomEvent');

            responsiveUserActions.registerComponent(mock.cmp);
            responsiveUserActions.handleResizeEvent();

            const button = mock.env.root.querySelector<HTMLElement>(`a.${ResponsiveDropdownHeader.DEFAULT_CSS_CLASS_NAME}`);
            button.click();

            expect(logCustomEventStub.callCount).toBe(1);
            expect(logCustomEventStub.args[0][0].name).toBe('openUserActions');
            expect(logCustomEventStub.args[0][0].type).toBe('User Actions');
        });
    });
});
