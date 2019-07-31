import { Component, ComponentOptions, IComponentBindings, $$, Initialization } from 'coveo-search-ui';
import { user } from '../../utils/icons';

/**
 * The options for the ViewedByCustomerComponent
 */
export interface IViewedByCustomerOptions {
    showIcon?: boolean;
    label?: string;
}

/**
 * Result component indicating if a search result have been viewed by the targeted user.
 */
export class ViewedByCustomer extends Component {
    /**
     * Unique Identifier used by the Search-UI.
     */
    public static readonly ID = 'ViewedByCustomer';

    /**
     * Default options used by the component.
     */
    public static readonly options: IViewedByCustomerOptions = {
        /**
         * If true, will display an icon when the component is displayed itself.
         */
        showIcon: ComponentOptions.buildBooleanOption({ defaultValue: true }),
        /**
         * The label that should be displayed when the component is displayed.
         */
        label: ComponentOptions.buildStringOption({ defaultValue: 'Viewed by Customer' })
    };

    /**
     * Create an instance of {@link ViewedByCustomer}.
     * @param element Element on which to bind the component.
     * @param options Initialization options of the component.
     * @param bindings Bindings of the Search-UI environment.
     */
    public constructor(public element: HTMLElement, public options: IViewedByCustomerOptions, public bindings?: IComponentBindings) {
        /* istanbul ignore next */
        super(element, ViewedByCustomer.ID, bindings);
        this.options = ComponentOptions.initComponentOptions(element, ViewedByCustomer, options);

        if (this.resolveResult().isUserActionView) {
            this.render();
        }
    }

    private render() {
        if (this.options.showIcon) {
            const iconElement = document.createElement('span');
            iconElement.className = 'viewed-by-customer-icon';
            iconElement.innerHTML = user;
            $$(this.element).append(iconElement);
        }

        const labelElement = document.createElement('span');
        labelElement.className = 'viewed-by-customer-label';
        labelElement.innerText = this.options.label;
        $$(this.element).append(labelElement);
    }
}

Initialization.registerAutoCreateComponent(ViewedByCustomer);
