import { $$, Assert } from 'coveo-search-ui';

/**
 * Initialization options of the **ExpandableList** class.
 */
export interface IExpandableListOptions<Item> {
    /**
     * Maximum number of items shown.
     *
     * Default: `8`
     */
    maximumItemsShown?: number;

    /**
     * Maximum number of items shown.
     *
     * Default: `4`
     */
    minimumItemsShown?: number;

    /**
     * Label of the list that is displayed as an header.
     *
     * Default: `Items`
     */
    listLabel?: string;

    /**
     * Function that tranform an item of the list into a HTMLElement representation.
     *
     * **Required**
     *
     * @param item Item of the list.
     */
    transform(item: Item): Promise<HTMLElement>;

    /** */
    messageWhenEmpty?: string;
    showMoreMessage?: string;
    showLessMessage?: string;
}

/**
 * Display a list that expand when click on the more button.
 */
export class ExpandableList<T> {
    private static readonly DEFAULTS = Object.freeze({
        LESS_LABEL: 'Show Less',
        MORE_LABEL: 'Show More',
        LIST_LABEL: 'Items',
        MAXIMUM_ITEMS_SHOWN: 8,
        MINIMUM_ITEMS_SHOWN: 4
    });
    private static readonly COMPONENT_CLASS = 'coveo-expandable-list';
    private static readonly EMPTY_CLASS = 'coveo-empty';

    private visibleItems: Promise<HTMLElement>[];
    private hiddenItems: Promise<HTMLElement>[];
    private isOpen = false;
    private button: HTMLButtonElement;
    private proccessedItem: Promise<HTMLElement>[];

    /**
     * Create an instance of the **ExpandableList** class.
     *
     * @param element Element on which to bind the component
     * @param items List of items to display.
     * @param options Initialization options.
     */
    constructor(public element: HTMLElement, public items: T[], public options: IExpandableListOptions<T>) {
        this.options = this.parseOptions(options);

        Assert.isNotUndefined(this.options.transform);
        Assert.isNotNull(this.options.transform);

        this.proccessedItem = items.slice(0, this.options.maximumItemsShown).map(this.options.transform);

        this.visibleItems = this.proccessedItem.slice(0, this.options.minimumItemsShown);
        this.hiddenItems = this.proccessedItem.slice(this.options.minimumItemsShown, this.options.maximumItemsShown);

        this.render();
    }

    private buildMoreButton() {
        const button = document.createElement('button');
        button.type = 'button';
        button.classList.add('coveo-more-less');
        button.addEventListener('click', this.toggleExpansion.bind(this));
        this.button = button;
        return button;
    }

    private isSomeItemsHidden() {
        return !(this.options.maximumItemsShown === this.options.minimumItemsShown || this.hiddenItems.length === 0);
    }

    private parseOptions(options: IExpandableListOptions<T>) {
        const moreOrEqualThan = (mininum: number, value: number) => (value >= mininum ? value : mininum);

        let parsedOptions = { ...options };

        parsedOptions.showLessMessage = parsedOptions.showLessMessage || ExpandableList.DEFAULTS.LESS_LABEL;
        parsedOptions.showMoreMessage = parsedOptions.showMoreMessage || ExpandableList.DEFAULTS.MORE_LABEL;

        parsedOptions.minimumItemsShown = parsedOptions.minimumItemsShown || ExpandableList.DEFAULTS.MINIMUM_ITEMS_SHOWN;
        parsedOptions.maximumItemsShown = parsedOptions.maximumItemsShown || ExpandableList.DEFAULTS.MAXIMUM_ITEMS_SHOWN;

        parsedOptions.minimumItemsShown = moreOrEqualThan(parsedOptions.minimumItemsShown, 1);
        parsedOptions.maximumItemsShown = moreOrEqualThan(parsedOptions.maximumItemsShown, parsedOptions.minimumItemsShown);
        parsedOptions.listLabel = parsedOptions.listLabel || ExpandableList.DEFAULTS.LIST_LABEL;

        return parsedOptions;
    }

    private render() {
        this.element.classList.add(ExpandableList.COMPONENT_CLASS);

        const header = document.createElement('h2');
        header.classList.add('coveo-title');
        header.innerText = this.options.listLabel;

        const list = document.createElement('ol');
        list.classList.add('coveo-list');

        this.element.appendChild(header);
        this.element.appendChild(list);

        if (this.isSomeItemsHidden()) {
            this.element.appendChild(this.buildMoreButton());
        }

        if (this.items.length === 0) {
            this.renderEmpty();
        } else {
            this.fold();
        }
    }

    private renderEmpty() {
        const list = this.element.querySelector<HTMLElement>('.coveo-list');
        const li = document.createElement('li');
        li.classList.add(ExpandableList.EMPTY_CLASS);
        li.innerText = this.options.messageWhenEmpty || '';

        list.appendChild(li);
    }

    private toggleExpansion() {
        if (this.isOpen) {
            this.fold();
        } else {
            this.unfold();
        }
        this.isOpen = !this.isOpen;
    }

    private fold() {
        this.update(this.visibleItems, this.options.showMoreMessage);
    }

    private unfold() {
        this.update([...this.visibleItems, ...this.hiddenItems], this.options.showLessMessage);
    }

    private async update(items: Promise<HTMLElement>[], buttonText: string) {
        const list = this.element.querySelector<HTMLOListElement>('.coveo-list') as HTMLElement;

        const listItems = (await Promise.all(items)).map(itemElement => {
            const listItem = document.createElement('li');
            listItem.appendChild(itemElement);
            return listItem;
        });

        list.innerHTML = '';
        listItems.forEach(itemElement => {
            $$(list).append(itemElement);
        });

        if (this.button) {
            this.button.innerText = buttonText;
        }
    }
}
