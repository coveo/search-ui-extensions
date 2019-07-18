import { ExpandableList } from '../../../src/components/UserActions/ExpandableList';
import { generate, delay } from '../../utils';

describe('ExpandableList', () => {
  const TEST_ITEM_LIST = generate(50, () => `test${Math.random()}`);

  const spanItemGenerator = async (item: string) => {
    let el = document.createElement('span');
    el.innerText = item;
    return el;
  };

  it('should render a no item message when there is no items', () => {
    const no_item_msg = 'no item';
    const list = new ExpandableList(document.createElement('div'), [], { itemProcessor: spanItemGenerator, messageWhenEmpty: no_item_msg });

    return delay(() => {
      const emptyElement = list.element.querySelector<HTMLLIElement>('.coveo-empty');
      expect(emptyElement).not.toBeNull();
      expect(emptyElement.innerText).toBe(no_item_msg);
    });
  });
  it('should render an ordered list of items', () => {
    const list = new ExpandableList(document.createElement('div'), TEST_ITEM_LIST, { itemProcessor: spanItemGenerator });

    return delay(() => {
      const listElement = list.element.querySelector<HTMLOListElement>('.coveo-list');
      expect(listElement).not.toBeNull();
      expect(listElement.childElementCount).toBe(list.options.min);
      listElement.childNodes.forEach((node, i) => {
        expect((node as HTMLLIElement).innerHTML).toContain(TEST_ITEM_LIST[i]);
      });
    });
  });
  it('should render a button with "Show More" as text', () => {
    const list = new ExpandableList(document.createElement('div'), TEST_ITEM_LIST, { itemProcessor: spanItemGenerator });

    return delay(() => {
      const el = list.element.querySelector<HTMLElement>('.coveo-more-less');
      expect(el).not.toBeNull();
      expect(el.innerText).toBe('Show More');
    });
  });
  it('should set the min option to a default value of 4', () => {
    const list = new ExpandableList(document.createElement('div'), TEST_ITEM_LIST, { itemProcessor: spanItemGenerator });

    expect(list.options.min).toBe(4);
  });
  it('should set the max option to a default value of 8', () => {
    const list = new ExpandableList(document.createElement('div'), TEST_ITEM_LIST, { itemProcessor: spanItemGenerator });

    expect(list.options.max).toBe(8);
  });
  it('should set the title option to a default value', () => {
    const list = new ExpandableList(document.createElement('div'), TEST_ITEM_LIST, { itemProcessor: spanItemGenerator });

    expect(list.options.title).not.toBeNull();
    expect(typeof list.options.title).toBe('string');
  });
  describe('show more/less button', () => {
    it('should start with a "Show More" text', () => {
      const list = new ExpandableList(document.createElement('div'), TEST_ITEM_LIST, { itemProcessor: spanItemGenerator, max: 10, min: 5 });

      return delay(() => {
        const el = list.element.querySelector<HTMLElement>('.coveo-more-less');
        expect(el).not.toBeNull();
        expect(el.innerText).toBe('Show More');
      });
    });
    it('should be hidden if the min option is the same as the max', () => {
      const list = new ExpandableList(document.createElement('div'), TEST_ITEM_LIST, { itemProcessor: spanItemGenerator, max: 5, min: 5 });
      const el = list.element.querySelector<HTMLElement>('.coveo-more-less');

      return delay(() => {
        expect(el).toBeNull();
      });
    });
    it('should show more items when the text of the button is "Show More" and change the button text to "Show Less"', () => {
      const list = new ExpandableList(document.createElement('div'), TEST_ITEM_LIST, { itemProcessor: spanItemGenerator, max: 10, min: 5 });
      const el = list.element.querySelector<HTMLElement>('.coveo-more-less');
      el.click();

      return delay(() => {
        const listElement = list.element.querySelector<HTMLOListElement>('.coveo-list');

        expect(el.innerText).toBe('Show Less');
        expect(listElement.childElementCount).toBe(list.options.max);
      });
    });
    it('should show less items when the text of the button is "Show Less" and change the button text to "Show More"', () => {
      const list = new ExpandableList(document.createElement('div'), TEST_ITEM_LIST, { itemProcessor: spanItemGenerator, max: 10, min: 5 });
      const el = list.element.querySelector<HTMLElement>('.coveo-more-less');
      el.click();
      el.click();

      return delay(() => {
        const listElement = list.element.querySelector<HTMLOListElement>('.coveo-list');

        expect(el.innerText).toBe('Show More');
        expect(listElement.childElementCount).toBe(list.options.min);
      });
    });
  });
});
