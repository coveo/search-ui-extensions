import { Component, ComponentOptions, IQueryResult, IResultsComponentBindings, $$ } from 'coveo-search-ui';

/**
 * The possible options for _ResultAction_.
 */
export interface IResultActionOptions {
    /**
     * The icon that the ResultAction will display.
     * If text is provided, the button will contain that text.
     * If the HTML of an SVG image is provided, that image will be displayed in the button.
     */
    icon?: string;

    /**
     * The tooltip that displays on hovering the ResultAction.
     */
    tooltip?: string;
}

/**
 * The base class for all ResultAction components.
 * Its main responsibility is handling the visual elements of the Result Action.
 */
export abstract class ResultAction extends Component {
    static ID = 'ResultAction';

    /**
     * The possible options for _ResultAction_.
     * @componentOptions
     */
    static options: IResultActionOptions = {
        /**
         * See {@link IResultActionOptions.icon}
         * Optional. You may instead provide the icon by appending it as a child element.
         */
        icon: ComponentOptions.buildStringOption(),

        /**
         * See {@link IResultActionOptions.tooltip}
         * Optional. If no tooltip is provided, the tooltip popup will not appear.
         */
        tooltip: ComponentOptions.buildStringOption()
    };

    private isInitialized = false;

    /**
     * Construct a ResultAction component.
     * @param element The HTML element bound to this component.
     * @param options The options that can be provided to this component.
     * @param bindings The bindings, or environment within which this component exists.
     * @param queryResult The result of the query in which this resultAction exists.
     */
    constructor(
        public element: HTMLElement,
        public options: IResultActionOptions,
        public bindings?: IResultsComponentBindings,
        public queryResult?: IQueryResult
    ) {
        super(element, ResultAction.ID, bindings);

        this.options = ComponentOptions.initComponentOptions(element, ResultAction, options);
        this.queryResult = this.queryResult || this.resolveResult();

        // Hide until initialized.
        $$(this.element).addClass('coveo-hidden');

        this.bind.on(this.element, 'click', () => this.doAction());
    }

    /**
     * The action that will be performed when the ResultAction is clicked.
     * @abstract
     */
    protected abstract doAction(): void;

    /**
     * Initializes the component if it is not already initialized.
     */
    protected init() {
        if (!this.isInitialized) {
            this.show();
            this.isInitialized = true;
        } else {
            this.logger.debug('Attempted to initialize ResultAction that was already initialized.');
        }
    }

    /**
     * Deactivate the component if it is initialized.
     * @param e The reason for the deactivation.
     */
    protected deactivate(e: string) {
        $$(this.element).remove();
        this.logger.warn(e);
        this.isInitialized = false;
    }

    /**
     * Make the result action button visible.
     */
    private show() {
        $$(this.element).removeClass('coveo-hidden');

        if (this.options.icon) {
            const icon = document.createElement('span');
            icon.innerHTML = this.options.icon;
            icon.className = 'coveo-icon';
            this.element.appendChild(icon);
        }

        if (this.options.tooltip) {
            const tooltip = document.createElement('span');
            tooltip.innerText = this.options.tooltip;
            tooltip.className = 'coveo-caption-for-icon';
            this.element.appendChild(tooltip);
        }
    }
}
