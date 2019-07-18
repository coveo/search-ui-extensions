import { $$ } from 'coveo-search-ui';

export interface IExpandableListOptions<T> {
  max?: number;
  min?: number;
  title?: string;
  itemProcessor(item: T): Promise<HTMLElement>;
  messageWhenEmpty?: string;
}

export class ExpandableList<T> {
  private static COMPONENT_CLASS = 'coveo-expandable-list';
  private static EMPTY_CLASS = 'coveo-empty';
  private static DEFAULT_MIN = 4;
  private static DEFAULT_MAX = 8;

  private visibleItems: Promise<HTMLElement>[];
  private hiddenItems: Promise<HTMLElement>[];
  private isOpen = false;
  private button: HTMLButtonElement;
  private proccessedItem: Promise<HTMLElement>[];

  constructor(public element: HTMLElement, public items: T[], public options: IExpandableListOptions<T>) {
    this.options = this.parseOptions(options);

    this.proccessedItem = items.slice(0, this.options.max).map(this.options.itemProcessor);

    this.visibleItems = this.proccessedItem.slice(0, this.options.min);
    this.hiddenItems = this.proccessedItem.slice(this.options.min, this.options.max);

    this.render();
  }

  private parseOptions(options: IExpandableListOptions<T>) {
    const moreOrEqualThan = (mininum: number, value: number) => (value >= mininum ? value : mininum);

    let parsedOptions = { ...options };

    parsedOptions.min = parsedOptions.min || ExpandableList.DEFAULT_MIN;
    parsedOptions.max = parsedOptions.max || ExpandableList.DEFAULT_MAX;

    parsedOptions.min = moreOrEqualThan(parsedOptions.min, 1);
    parsedOptions.max = moreOrEqualThan(parsedOptions.max, parsedOptions.min);
    parsedOptions.title = parsedOptions.title || 'Items';

    return parsedOptions;
  }

  private render() {
    this.element.classList.add(ExpandableList.COMPONENT_CLASS);
    this.element.innerHTML = `<h2 class="coveo-title">${this.options.title}</h2>
    <ol class="coveo-list"></ol>
    ${this.noHiddenItems() ? '' : '<button class="coveo-more-less"></button>'}`;

    this.button = this.element.querySelector<HTMLButtonElement>('.coveo-more-less');

    if (this.button) {
      this.button.addEventListener('click', this.click.bind(this));
    }

    if (this.items.length === 0) {
      this.renderEmpty();
    } else {
      this.showLess();
    }
  }

  private renderEmpty() {
    const list = this.element.querySelector<HTMLOListElement>('.coveo-list') as HTMLElement;
    const li = document.createElement('li');
    li.classList.add(ExpandableList.EMPTY_CLASS);
    li.innerText = this.options.messageWhenEmpty || '';

    list.appendChild(li);
  }

  private click() {
    if (this.isOpen) {
      this.showLess();
    } else {
      this.showMore();
    }
    this.isOpen = !this.isOpen;
  }

  private showMore() {
    this.update([...this.visibleItems, ...this.hiddenItems], 'Show Less');
  }

  private showLess() {
    this.update(this.visibleItems, 'Show More');
  }

  private noHiddenItems() {
    return this.options.max === this.options.min || this.hiddenItems.length <= 0;
  }

  private async update(items: Promise<HTMLElement>[], buttonText: string) {
    const list = this.element.querySelector<HTMLOListElement>('.coveo-list') as HTMLElement;
    const elements = (await Promise.all(items)).map(element => {
      const el = document.createElement('li');
      el.appendChild(element);
      return el;
    });

    list.innerHTML = '';
    elements.forEach(el => {
      $$(list).append(el);
    });

    if (this.button) {
      this.button.innerText = buttonText;
    }
  }
}
