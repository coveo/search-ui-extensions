import { ResultAction, IResultActionOptions } from '../ResultAction/ResultAction';
import { ComponentOptions, l, IResultsComponentBindings, IQueryResult, StringUtils, Initialization } from 'coveo-search-ui';
import { copyToClipboard } from '../../utils/icons';
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
        icon: ComponentOptions.buildStringOption({ defaultValue: copyToClipboard }),

        tooltip: ComponentOptions.buildCustomOption(tooltip => tooltip, { defaultFunction: () => l('CopyToClipboard_copy') }),

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
        super(element, ComponentOptions.initComponentOptions(element, copyToClipboard, options), bindings, result);

        super.init();

        this.bind.on(this.element, 'mouseleave', (event: MouseEvent) => {
            if (event.target == this.element) {
                this.element.querySelector<HTMLElement>('.coveo-caption-for-icon').innerText = l('CopyToClipboard_copy');
            }
        });
    }

    protected doAction() {
        this.usageAnalytics.logClickEvent({ name: 'copyToClipboard', type: 'Click' }, {}, this.result, this.element);
        this.copyToClipboard(StringUtils.buildStringTemplateFromResult(this.options.template, this.result));
    }

    private copyToClipboard(text: string) {
        if (navigator && navigator.clipboard) {
            navigator.clipboard
                .writeText(text)
                .then(() => (this.element.querySelector<HTMLElement>('.coveo-caption-for-icon').innerText = l('CopyToClipboard_copied')))
                .catch(err => this.logger.error('Copy to clipboard failed.', text, err));
        } else {
            this.copyToClipboardFallback(text);
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

Initialization.registerComponentFields(CopyToClipboard.ID, ['title', 'ClickUri']);
Initialization.registerAutoCreateComponent(CopyToClipboard);
