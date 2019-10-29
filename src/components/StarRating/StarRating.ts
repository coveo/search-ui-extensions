import {
    $$,
    Utils,
    Component,
    ComponentOptions,
    IComponentBindings,
    Initialization,
} from 'coveo-search-ui';
import { star as starIcon } from '../../utils/icons';

export interface IStarRatingOptions {
    /** Specifies the rating to be displayed as stars. */
    rating: number,
    /** Specifies the number to be displayed indicating the number of reviews. */
    numberOfRatings?: number
}
/**
 * The `StarRating` component renders a 5-star rating widget.
 *
 * This component is a result template component (see [Result Templates](https://developers.coveo.com/x/aIGfAQ)).
 */
export class StarRating extends Component {
    static ID = 'StarRating';

    static options: IStarRatingOptions = {
        rating: ComponentOptions.buildNumberOption({
            defaultValue: 0
        }),
        numberOfRatings: ComponentOptions.buildNumberOption({
            defaultValue: 0
        }),
    };

  /**
   * Creates a new `StarRating` component.
   * @param element The HTMLElement on which to instantiate the component.
   * @param options The options for the `StarRating` component.
   * @param bindings The bindings that the component requires to function normally. If not set, these will be
   * automatically resolved (with a slower execution time).
   */
    constructor(
        public element: HTMLElement,
        public options: IStarRatingOptions,
        public bindings?: IComponentBindings,
    ) {
        super(element, StarRating.ID);
        this.options = ComponentOptions.initComponentOptions(element, StarRating, options);
        if (!Utils.isNullOrUndefined(options.rating)) {
            this.renderComponent(element, options);
        }
    }

    private renderComponent(element: HTMLElement, options: IStarRatingOptions) {
        for (let starNumber = 1; starNumber <= 5; starNumber++) {
            this.renderStar(element, starNumber <= options.rating, starNumber);
        }
        this.renderNumberOfReviews(element, options.numberOfRatings);
    }

    private renderStar(element: HTMLElement, isChecked: boolean, value: number) {
        const star = $$('span', { className: 'coveo-star-rating-star' }, starIcon);
        star.children()[0].classList.add('coveo-star-rating-star-svg');;
        element.appendChild(star.el);
        star.toggleClass('coveo-star-rating-star-active', isChecked);
    }

    private renderNumberOfReviews(element: HTMLElement, value: number) {
        const numberString = $$('span', { className: 'coveo-star-rating-number' });
        (value > 0) ? numberString.el.innerText = `(${value})` : numberString.el.innerText = 'No Ratings'
        element.append(numberString.el);
    }
}

Initialization.registerAutoCreateComponent(StarRating);
