import { $$, Component, Initialization, ComponentOptions, IComponentBindings, l, Utils, IQueryResult, IFieldOption } from 'coveo-search-ui';
import { star as starIcon } from '../../utils/icons';
import './Strings';

const DEFAULT_SCALE = 5;

export interface IStarRatingOptions {
    /** Specifies the rating to be displayed as stars. */
    rating?: IFieldOption;
    /** Specifies the number to be displayed indicating the number of reviews. */
    numberOfRatings?: IFieldOption;
    /** Specified the rating scale. Default is 0-5 */
    ratingScale?: number;
}
/**
 * The `StarRating` component renders a 5-star rating widget.
 *
 * This component is a result template component (see [Result Templates](https://developers.coveo.com/x/aIGfAQ)).
 */
export class StarRating extends Component {
    static ID = 'StarRating';
    private rating: number;
    private numberOfRatings: number;
    private ratingScale: number;

    static options: IStarRatingOptions = {
        rating: ComponentOptions.buildFieldOption({ defaultValue: '0', required: true }),
        numberOfRatings: ComponentOptions.buildFieldOption({ defaultValue: '0', required: false }),
        ratingScale: ComponentOptions.buildNumberOption({ defaultValue: DEFAULT_SCALE })
    };

    /**
     * Creates a new `StarRating` component.
     * @param element The HTMLElement on which to instantiate the component.
     * @param options The options for the `StarRating` component.
     * @param bindings The bindings that the component requires to function normally.
     */
    constructor(public element: HTMLElement, public options: IStarRatingOptions, public bindings?: IComponentBindings, result?: IQueryResult) {
        super(element, StarRating.ID);
        this.options = ComponentOptions.initComponentOptions(element, StarRating, options);

        if (result) {
            if (this.getValuesFromFields(result)) {
                this.renderComponent(element);
            }
        } else if (this.element.parentElement != null) {
            this.element.parentElement.removeChild(this.element);
        }
    }

    private getValuesFromFields(result: IQueryResult): boolean {
        const rawRating = Utils.getFieldValue(result, <string>this.options.rating);
        const rawNumberOfRatings = Utils.getFieldValue(result, <string>this.options.numberOfRatings);

        this.rating = Number(rawRating) < 0 ? 0 : Number(rawRating);
        this.numberOfRatings = Number(rawNumberOfRatings) < 0 ? 0 : Number(rawNumberOfRatings);
        this.ratingScale = this.options.ratingScale;

        if (this.ratingScale < this.rating || this.ratingScale <= 0) {
            console.error(`The specified Star Rating of {${this.ratingScale}} scale is invalid.`);
            return false;
        } else {
            this.rating = Math.floor(this.rating * (DEFAULT_SCALE / this.ratingScale));
            return true;
        }
    }

    private renderComponent(element: HTMLElement) {
        for (let starNumber = 1; starNumber <= DEFAULT_SCALE; starNumber++) {
            this.renderStar(element, starNumber <= this.rating, starNumber);
        }
        this.renderNumberOfReviews(element, this.numberOfRatings);
    }

    private renderStar(element: HTMLElement, isChecked: boolean, value: number) {
        const star = $$('span', { className: 'coveo-star-rating-star' }, starIcon);
        star.toggleClass('coveo-star-rating-star-active', isChecked);
        element.appendChild(star.el);
    }

    private renderNumberOfReviews(element: HTMLElement, value: number) {
        const numberString = $$('span', { className: 'coveo-star-rating-label' });
        numberString.el.innerText = value > 0 ? `(${value})` : l(`${StarRating.ID}_NoRatingsLabel`);
        element.append(numberString.el);
    }
}

Initialization.registerAutoCreateComponent(StarRating);
