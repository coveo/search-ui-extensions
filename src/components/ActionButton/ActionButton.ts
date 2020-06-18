import { Component, ComponentOptions, IResultsComponentBindings, Initialization } from 'coveo-search-ui';

export interface IActionButtonOptions {
    icon?: string;
    title?: string;
    tooltip?: string;
    click?: () => void;
}

/**
 * The _ActionButton_ component is a simple button allowing to show an icon, text, and tooltip.
 *
 * ```html
 * <button class='CoveoActionButton'></button>
 * ```
 */
export class ActionButton extends Component {
    static ID = 'ActionButton';

    /**
     * The possible options for _ActionButton_.
     * @componentOptions
     */
    static options: IActionButtonOptions = {
        /**
         * Specifies the button label. The text is displayed on a single line, next to the icon.
         *
         * Default is the empty string.
         *
         * ```html
         * <button class='CoveoActionButton' data-title='My Button'></button>
         * ```
         */
        title: ComponentOptions.buildStringOption(),

        /**
         * Specifies the button tooltip text.
         *
         * Default is the empty string.
         *
         * ```html
         * <button class='CoveoActionButton' data-tooltip='My button tooltip'></button>
         * ```
         */
        tooltip: ComponentOptions.buildStringOption(),

        /**
         * Specifies the button SVG icon.
         * Note: The SVG markup has to be HTML encoded when set using the HTML attributes.
         *
         * Default is the empty string.
         *
         * For example, with this SVG markup:
         *
         * ```xml
         * <svg width="1em" height="1em">...</svg>
         * ```
         *
         * The attribute would be set like this:
         *
         * ```html
         * <button class='CoveoActionButton' data-icon='&lt;svg width=&quot;1em&quot; height=&quot;1em&quot;&gt;...&lt;/svg&gt;'></button>
         * ```
         */
        icon: ComponentOptions.buildStringOption(),

        /**
         * Specifies the handler called when the button is clicked.
         *
         * Default is `null`.
         *
         * This option must be set in JavaScript when initializing the component.
         */
        click: ComponentOptions.buildCustomOption(s => null, { required: true })
    };

    constructor(public element: HTMLElement, public options: IActionButtonOptions, public bindings?: IResultsComponentBindings) {
        super(element, ActionButton.ID, bindings);

        this.options = ComponentOptions.initComponentOptions(element, ActionButton, options);

        if (this.options.icon || this.options.title) {
            this.render();
        } else {
            console.warn('The action button cannot render since no icon nor title is defined.');
            Coveo.$$(this.element).hide();
        }

        if (this.options.click) {
            Coveo.$$(element).on('click', () => this.options.click());
        }
    }

    /**
     * Updates the button icon.
     * @param icon Markup of the SVG icon to set.
     */
    public updateIcon(icon: string): void {
        const iconElement = this.element.querySelector('.coveo-actionbutton_icon');
        if (iconElement && icon && icon != iconElement.innerHTML) {
            iconElement.innerHTML = icon;
        }
    }

    /**
     * Updates the button tooltip.
     * @param tooltip The tooltip to set.
     */
    public updateTooltip(tooltip: string): void {
        if (tooltip && tooltip != this.element.title) {
            this.element.title = tooltip;
        }
    }

    protected render(): void {
        this.applyButtonStyles();

        if (this.options.icon) {
            this.appendIcon();
        }
        if (this.options.title) {
            this.appendTitle();
        }
        if (this.options.tooltip) {
            this.appendTooltip();
        }
    }

    protected applyButtonStyles(): void {
        this.element.classList.add('coveo-actionbutton');

        if (this.options.icon && !this.options.title) {
            this.element.classList.add('coveo-actionbutton-icononly');
        }
    }

    protected createIconElement(): HTMLElement {
        const iconElement = document.createElement('span');
        iconElement.classList.add('coveo-icon', 'coveo-actionbutton_icon');
        iconElement.innerHTML = this.options.icon;
        return iconElement;
    }

    protected createTitleElement(): HTMLElement {
        const titleElement = document.createElement('span');
        titleElement.classList.add('coveo-actionbutton_title');
        titleElement.innerText = this.options.title;
        return titleElement;
    }

    private appendIcon(): void {
        this.element.appendChild(this.createIconElement());
    }

    private appendTitle(): void {
        this.element.appendChild(this.createTitleElement());
    }

    private appendTooltip(): void {
        this.element.title = this.options.tooltip;
    }
}

Initialization.registerAutoCreateComponent(ActionButton);
