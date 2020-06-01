import { Component, ComponentOptions, IResultsComponentBindings, Initialization } from 'coveo-search-ui';

export interface IActionButtonOptions {
    title?: string;
    tooltip?: string;
    icon?: string;
    click?: () => void;
}

export class ActionButton extends Component {
    static ID = 'ActionButton';

    /**
     * The possible options for _ActionButton_.
     * @componentOptions
     */
    static options: IActionButtonOptions = {
        title: ComponentOptions.buildStringOption(),

        tooltip: ComponentOptions.buildStringOption(),

        icon: ComponentOptions.buildStringOption()
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
            this.element.classList.add('coveo-actionbutton-icon');
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
