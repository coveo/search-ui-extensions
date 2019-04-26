import {
    Component,
    ComponentOptions,
    IComponentBindings,
    $$,
    IQueryResult,
    Initialization,
    IAnalyticsCaseAttachMeta,
    IAnalyticsCaseDetachMeta,
    analyticsActionCauseList,
    IAnalyticsActionCause
} from 'coveo-search-ui';
import * as PaperclipIcon from '../../../img/paperclip.svg';

export interface IAttachResultOptions {
    /** Specifies the tooltip displayed when the result is not attached. */
    attachCaption?: string;
    /** Specifies the tooltip displayed when the result is already attached. */
    detachCaption?: string;
    /** The function that is called when the user wants to attach a result. */
    attach?: (queryResult: IQueryResult) => Promise<void>;
    /** The function called when the user wants to un-link a result. */
    detach?: (queryResult: IQueryResult) => Promise<void>;
    /** Optional function to check the initial state of the component. */
    isAttached?: (queryResult: IQueryResult) => Promise<boolean>;
}

/**
 * The AttachResult component allows a user to link a search result to something else in their external
 * system, for instance a case, incident, request, etc.
 */
export class AttachResult extends Component {
    static ID = 'AttachResult';

    private loading: boolean;
    private attached: boolean;
    private buttonElement: HTMLElement;
    private tooltipElement: HTMLElement;

    static options: IAttachResultOptions = {
        attachCaption: ComponentOptions.buildStringOption({
            defaultValue: 'Attach Result'
        }),
        detachCaption: ComponentOptions.buildStringOption({
            defaultValue: 'Detach Result'
        }),
        attach: ComponentOptions.buildCustomOption(
            name => (result: IQueryResult) =>
                new Promise<void>((resolve, reject) => {
                    console.log('attached ', result);
                    resolve();
                }),
            {
                defaultFunction: () => (result: IQueryResult) =>
                    new Promise<void>((resolve, reject) => {
                        console.log('attached ', result);
                        resolve();
                    })
            }
        ),
        detach: ComponentOptions.buildCustomOption(
            name => (result: IQueryResult) =>
                new Promise<void>((resolve, reject) => {
                    console.log('detached ', result);
                    resolve();
                }),
            {
                defaultFunction: () => (result: IQueryResult) =>
                    new Promise<void>((resolve, reject) => {
                        console.log('detached ', result);
                        resolve();
                    })
            }
        )
    };

    constructor(
        public element: HTMLElement,
        public options: IAttachResultOptions,
        public bindings?: IComponentBindings,
        public queryResult?: IQueryResult
    ) {
        super(element, AttachResult.ID, bindings);

        this.options = ComponentOptions.initComponentOptions(
            element,
            AttachResult,
            options
        );
        this.queryResult = this.queryResult || this.resolveResult();

        this.initialize();

        this.bind.on(this.element, 'click', this.toggleAttached);
    }

    /**
     * Gets whether or not the result is currently attached.
     */
    public isAttached(): boolean {
        return !!this.attached;
    }

    /**
     * Attach the query result.
     */
    public attach(): Promise<void> {
        if (this.attached || this.loading) {
            return Promise.resolve();
        }

        this.setLoading(true);
        return this.options
            .attach(this.queryResult)
            .then(() => {
                this.attached = true;
                this.logAnalyticsCaseEvent(analyticsActionCauseList.caseAttach);
            })
            .finally(() => {
                this.setLoading(false);
            });
    }

    /**
     * Detach the query result.
     */
    public detach(): Promise<void> {
        if (!this.attached && !this.loading) {
            return Promise.resolve();
        }

        this.setLoading(true);
        return this.options
            .detach(this.queryResult)
            .then(() => {
                this.attached = false;
                this.logAnalyticsCaseEvent(analyticsActionCauseList.caseDetach);
            })
            .finally(() => {
                this.setLoading(false);
            });
    }

    /** Toggle the state of the component. If the current result is not attached, attach it, if not, detach it. */
    public toggleAttached(): void {
        this.attached ? this.detach() : this.attach();
    }

    protected initialize(): void {
        this.buttonElement = $$('div', {}, PaperclipIcon).el;
        this.element.appendChild(this.buttonElement);

        this.tooltipElement = $$('div', {
            className: 'coveo-caption-for-icon'
        }).el;
        this.element.appendChild(this.tooltipElement);

        this.updateInitialAttachedState();
    }

    protected updateInitialAttachedState() {
        this.attached = false;
        this.render();

        // Resolve the current result for the component and the initial state.
        if (this.options.isAttached) {
            this.setLoading(true);
            this.options
                .isAttached(this.queryResult)
                .then(attached => {
                    this.attached = attached;
                })
                .catch(error => {
                    this.logger.error(
                        'Error retrieving initial result attached state.',
                        error
                    );
                })
                .finally(() => {
                    this.setLoading(false);
                });
        }
    }

    /** Set the loading property and updates the component UI. */
    protected setLoading(loading: boolean): void {
        this.loading = loading;
        this.render();
    }

    protected logAnalyticsCaseEvent(cause: IAnalyticsActionCause) {
        let customData: IAnalyticsCaseAttachMeta = {
            resultUriHash: this.queryResult.raw.urihash,
            author: this.queryResult.raw.author,
            articleID: null,
            caseID: null
        };

        this.usageAnalytics.logCustomEvent<IAnalyticsCaseDetachMeta>(
            cause,
            customData,
            this.root
        );
    }

    protected render(): void {
        $$(this.buttonElement).removeClass('coveo-icon-attached');
        $$(this.buttonElement).removeClass('coveo-icon-attach');
        $$(this.buttonElement).removeClass('coveo-icon-loading');

        if (this.loading) {
            $$(this.buttonElement).addClass('coveo-icon-loading');
        } else {
            if (this.attached) {
                $$(this.buttonElement).addClass('coveo-icon-attached');
                $$(this.tooltipElement).text(this.options.detachCaption);
            } else {
                $$(this.buttonElement).addClass('coveo-icon-attach');
                $$(this.tooltipElement).text(this.options.attachCaption);
            }
        }
    }
}

Initialization.registerComponentFields(AttachResult.ID, ['urihash']);
Initialization.registerAutoCreateComponent(AttachResult);
