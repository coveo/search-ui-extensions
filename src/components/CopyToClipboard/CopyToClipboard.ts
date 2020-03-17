import { ResultAction, IResultActionOptions } from '../ResultAction/ResultAction';
import { ComponentOptions, l, IResultsComponentBindings, IQueryResult, StringUtils, Initialization } from 'coveo-search-ui';
import { copy } from '../../utils/icons';
import './Strings';

export interface ICopyToClipboardOptions extends IResultActionOptions {
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

    /**
     * The tooltip that displays when the action succeeds.
     */
    successTooltip?: string;

    /**
     * Specifies the template that will be used for the copy to clipboard.
     *
     * Default value is `${title}\n${ClickUri}`.
     */
    template?: string;
}

export class CopyToClipboard extends ResultAction {
    static ID = 'CopyToClipboard';

    /**
     * The possible options for _ResultAction_.
     * @componentOptions
     */
    static options: ICopyToClipboardOptions = {
        icon: ComponentOptions.buildStringOption({ defaultValue: copy }),

        tooltip: ComponentOptions.buildCustomOption(tooltip => tooltip, { defaultFunction: () => l('CopyToClipboard_copy') }),

        successTooltip: ComponentOptions.buildCustomOption(tooltip => tooltip, { defaultFunction: () => l('CopyToClipboard_copied') }),

        template: ComponentOptions.buildStringOption({ defaultValue: '${title}\n${clickUri}' })
    };

    /**
     * Construct a ResultAction component.
     * @param element The HTML element bound to this component.
     * @param options The options that can be provided to this component.
     * @param bindings The bindings, or environment within which this component exists.
     * @param result The result of the query in which this resultAction exists.
     */
    constructor(
        public element: HTMLElement,
        public options: ICopyToClipboardOptions,
        public bindings?: IResultsComponentBindings,
        public result?: IQueryResult
    ) {
        super(element, ComponentOptions.initComponentOptions(element, CopyToClipboard, options), bindings, result);

        super.init();

        this.bind.on(this.element, 'mouseleave', (event: MouseEvent) => {
            if (event.target == this.element) {
                this.setToolipText(this.options.tooltip);
            }
        });
    }

    protected doAction() {
        this.usageAnalytics.logClickEvent({ name: 'copyToClipboard', type: 'resultAction' }, {}, this.result, this.element);
        this.copyToClipboard(StringUtils.buildStringTemplateFromResult(this.options.template, this.result));
    }

    private async copyToClipboard(text: string) {
        if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(text);
            } catch (err) {
                this.logger.error('Copy to clipboard failed.', text, err);
                this.copyToClipboardFallback(text);
            }
        } else {
            this.copyToClipboardFallback(text);
        }
        this.setToolipText(this.options.successTooltip);
    }

    private setToolipText(text: string) {
        const tooltipElement = this.element.querySelector<HTMLElement>('.coveo-caption-for-icon');
        if (tooltipElement && text) {
            tooltipElement.innerText = text;
        }
    }

    /**
     * Sadly that's the only way of doing in in IE11 and in lockerservice.
     */
    private copyToClipboardFallback(text: string) {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }
}

Initialization.registerComponentFields(CopyToClipboard.ID, ['title', 'clickUri']);
Initialization.registerAutoCreateComponent(CopyToClipboard);
