import { StarRating } from '../../../src/Index';
import { l, $$, IQueryResult } from 'coveo-search-ui';
import { Mock } from 'coveo-search-ui-tests';
import { IStarRatingOptions } from '../../../src/components/StarRating/StarRating';
import '../../../src/components/StarRating/Strings';
import { Fake } from 'coveo-search-ui-tests';

const CONTAINER_CSS_CLASS = 'CoveoStarRating';
const STAR_CSS_CLASS = 'coveo-star-rating-star';
const ACTIVE_STAR_CSS_CLASS = 'coveo-star-rating-star-active';
const STAR_LABEL_CSS_CLASS = 'coveo-star-rating-label';

const getActiveStars = (starRatingElement: HTMLElement) => {
    const children = starRatingElement.children;
    let numStars = 0;
    let numActiveStars = 0;
    let i = 0;
    for (; i < children.length; i++) {
        if (children.item(i).classList.contains(STAR_CSS_CLASS)) {
            if (children.item(i).classList.contains(ACTIVE_STAR_CSS_CLASS)) {
                numActiveStars++;
            }
            numStars++;
        }
    }
    return { numStars: numStars, numActiveStars: numActiveStars };
};

describe('StarRating', () => {
    let test: Mock.IBasicComponentSetup<StarRating>;

    function initStarRatingComponent(ratingValue: String, numRatingsValue?: String) {
        const options: IStarRatingOptions = { rating: '@rating', numberOfRatings: '@numberOfRatings' };
        const result: IQueryResult = Fake.createFakeResult();

        result.raw.rating = ratingValue;
        result.raw.numberOfRatings = numRatingsValue;

        test = Mock.advancedResultComponentSetup<StarRating>(StarRating, result, <Mock.AdvancedComponentSetupOptions>{
            element: $$('div').el,
            cmpOptions: options,
            modifyBuilder: (builder: Mock.MockEnvironmentBuilder) => {
                return builder;
            }
        });
    }

    describe('When the component is instantiated', () => {
        it('should have correct class type', () => {
            initStarRatingComponent('0', '0');

            expect(test.cmp.element.classList.contains(CONTAINER_CSS_CLASS)).toBeTruthy;
        });

        describe('The star elements', () => {
            it('should display five stars with a number of active stars equal to rating given', () => {
                for (let i = 0; i <= 5; i++) {
                    initStarRatingComponent(i.toString());
                    let starData = getActiveStars(test.cmp.element);

                    expect(starData.numStars).toBe(5);
                    expect(starData.numActiveStars).toBe(i);
                }
            });

            it('should display no active stars when the rating provided is negative', () => {
                const testRating = -Number.MAX_SAFE_INTEGER;
                initStarRatingComponent(testRating.toString());
                let starData = getActiveStars(test.cmp.element);

                expect(starData.numStars).toBe(5);
                expect(starData.numActiveStars).toBe(0);
            });
        });

        describe('The label showing number of ratings', () => {
            it('should display a label with "No Ratings" shown when there are none', () => {
                initStarRatingComponent((0).toString());
                const testLabel = test.cmp.element.lastElementChild;

                expect(testLabel.className).toEqual(STAR_LABEL_CSS_CLASS);
                expect(testLabel.textContent).toEqual(l(`${StarRating.ID}_NoRatingsLabel`));
            });

            it('should display a label with "No Ratings" shown when a negative number is given', () => {
                const testNumRatings = -Number.MAX_SAFE_INTEGER;
                initStarRatingComponent((0).toString(), testNumRatings.toString());
                const testLabel = test.cmp.element.lastElementChild;

                expect(testLabel.className).toEqual(STAR_LABEL_CSS_CLASS);
                expect(testLabel.textContent).toEqual(l(`${StarRating.ID}_NoRatingsLabel`));
            });

            it('should display the number when they are provided', () => {
                const testNumRatings = Number.MAX_SAFE_INTEGER;
                initStarRatingComponent((0).toString(), testNumRatings.toString());
                const testLabel = test.cmp.element.lastElementChild;

                expect(testLabel.className).toEqual(STAR_LABEL_CSS_CLASS);
                expect(testLabel.textContent).toEqual(`(${testNumRatings})`);
            });
        });
    });
});
