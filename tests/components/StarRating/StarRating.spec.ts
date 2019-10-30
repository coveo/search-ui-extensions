import { StarRating } from '../../../src/Index';
import { Mock } from 'coveo-search-ui-tests';
import { IStarRatingOptions } from '../../../src/components/StarRating/StarRating';

const CONTAINER_CSS_CLASS = 'CoveoStarRating';
const STAR_CSS_CLASS = 'coveo-star-rating-star';
const ACTIVE_STAR_CSS_CLASS = 'coveo-star-rating-star-active';
const STAR_LABEL_CSS_CLASS = 'coveo-star-rating-label';

const getActiveStars = (starRatingElement: HTMLElement) => {
    const children = starRatingElement.children;
    let numStars = 0;
    let numActiveStars = 0;
    for (let i = 0; i < children.length; i++) {
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
    describe('When the component is instantiated', () => {
        it('should have correct class type', () => {
            const testOptions: IStarRatingOptions = { rating: 0 };
            const testSubject = Mock.basicComponentSetup<StarRating>(StarRating, testOptions);
            expect(testSubject.cmp.element.className).toEqual(CONTAINER_CSS_CLASS);
        });

        it('should display five stars with a number of active stars equal to rating given', () => {
            for (let i = 0; i <= 5; i++) {
                let testOptions: IStarRatingOptions = { rating: i };
                let testSubject = Mock.basicComponentSetup<StarRating>(StarRating, testOptions);
                let starData = getActiveStars(testSubject.cmp.element);
                expect(starData.numStars).toBe(5);
                expect(starData.numActiveStars).toBe(i);
            }
        });

        describe('The label showing number of ratings', () => {
            it('should display a label with "No Ratings" shown when there are none', () => {
                const testOptions: IStarRatingOptions = { rating: 0 };
                const testSubject = Mock.basicComponentSetup<StarRating>(StarRating, testOptions);
                const testLabel = testSubject.cmp.element.lastElementChild;
                expect(testLabel.className).toEqual(STAR_LABEL_CSS_CLASS);
                expect(testLabel.textContent).toEqual('No Ratings');
            });

            it('should display the number when they are provided', () => {
                const testNumRatings = 69;
                const testOptions: IStarRatingOptions = { rating: 0, numberOfRatings: testNumRatings };
                const testSubject = Mock.basicComponentSetup<StarRating>(StarRating, testOptions);
                const testLabel = testSubject.cmp.element.lastElementChild;
                expect(testLabel.className).toEqual(STAR_LABEL_CSS_CLASS);
                expect(testLabel.textContent).toEqual(`(${testNumRatings})`);
            });
        });
    });
});
