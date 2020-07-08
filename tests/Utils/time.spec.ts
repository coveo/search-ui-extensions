import {
    formatDate,
    formatDateShort,
    formatTime,
    formatTimeShort,
    formatDateAndTime,
    formatDateAndTimeShort,
    formatTimeInterval,
} from '../../src/utils/time';

const UTC_TEST_TIME = '2019-04-29T20:53:13';

describe('Time', () => {
    describe('formatDate', () => {
        it('should format a date to a string like "Mon, Apr 29, 2019" when in a EN_US context', () => {
            const formatedDate = formatDate(new Date(UTC_TEST_TIME));
            expect(formatedDate).toEqual('Mon, Apr 29, 2019');
        });
    });

    describe('formatDate', () => {
        it('should format a date to a string like "Apr 29" when in a EN_US context', () => {
            const formatedDate = formatDateShort(new Date(UTC_TEST_TIME));
            expect(formatedDate).toEqual('Apr 29');
        });
    });

    describe('formatTime', () => {
        it('should format a date to a string format like "08:53:13 PM" when in a EN_US context', () => {
            const formatedTime = formatTime(new Date(UTC_TEST_TIME));
            expect(formatedTime).toEqual('08:53:13 PM');
        });
    });

    describe('formatTime', () => {
        it('should format a date to a string format like "08:53 PM" when in a EN_US context', () => {
            const formatedTime = formatTimeShort(new Date(UTC_TEST_TIME));
            expect(formatedTime).toEqual('08:53 PM');
        });
    });

    describe('formatDateAndTime', () => {
        it('should format a date and time to a string like "Mon, Apr 29, 2019 - 8:53 PM" when in a EN_US context', () => {
            const formatedDateAndTime = formatDateAndTime(new Date(UTC_TEST_TIME));
            expect(formatedDateAndTime).toEqual('Mon, Apr 29, 2019 - 08:53 PM');
        });
    });

    describe('formatDateAndTimeShort', () => {
        it('should format a date to a string like "Apr 29 - 08:53 PM"', () => {
            const formatedShortDate = formatDateAndTimeShort(new Date(UTC_TEST_TIME));
            expect(formatedShortDate).toEqual('Apr 29 - 08:53 PM');
        });
    });

    describe('formatTimeInterval', () => {
        const SECOND = 1000;
        const MINUTE = 60 * SECOND;
        const HOUR = 60 * MINUTE;
        const DAY = 24 * HOUR;
        const WEEK = 7 * DAY;

        it('should display the number of weeks and days when the duration is longer than a week', () => {
            expect(formatTimeInterval(3 * WEEK + 2 * DAY)).toBe('3 weeks 2 days');
            expect(formatTimeInterval(3 * WEEK + 2 * DAY + 23 * HOUR)).toBe('3 weeks 2 days');
        });

        it('should display only the number of weeks when the duration is longer than a week but the number of days is zero', () => {
            expect(formatTimeInterval(3 * WEEK)).toBe('3 weeks');
            expect(formatTimeInterval(3 * WEEK + 23 * HOUR)).toBe('3 weeks');
        });

        it('should display weeks as singular when there is only one week', () => {
            expect(formatTimeInterval(1 * WEEK)).toBe('1 week');
        });

        it('should display the number of days and hours when the duration is longer than a day', () => {
            expect(formatTimeInterval(5 * DAY + 13 * HOUR)).toBe('5 days 13 hours');
            expect(formatTimeInterval(5 * DAY + 13 * HOUR + 59 * MINUTE)).toBe('5 days 13 hours');
        });

        it('should display only the number of days when the duration is longer than a week but the number of hours is zero', () => {
            expect(formatTimeInterval(5 * DAY)).toBe('5 days');
            expect(formatTimeInterval(5 * DAY + 59 * MINUTE)).toBe('5 days');
        });

        it('should display days as singular when there is only one day', () => {
            expect(formatTimeInterval(1 * DAY)).toBe('1 day');
        });

        it('should display the number of hours and minutes when the duration is longer than a hour', () => {
            expect(formatTimeInterval(7 * HOUR + 13 * MINUTE)).toBe('7 hours 13 minutes');
            expect(formatTimeInterval(7 * HOUR + 13 * MINUTE + 59 * SECOND)).toBe('7 hours 13 minutes');
        });

        it('should display only the number of hours when the duration is longer than a week but the number of minutes is zero', () => {
            expect(formatTimeInterval(7 * HOUR)).toBe('7 hours');
            expect(formatTimeInterval(7 * HOUR + 59 * SECOND)).toBe('7 hours');
        });

        it('should display hours as singular when there is only one hour', () => {
            expect(formatTimeInterval(1 * HOUR)).toBe('1 hour');
        });

        it('should display the number of minutes and seconds when the duration is longer than a minute', () => {
            expect(formatTimeInterval(27 * MINUTE + 59 * SECOND)).toBe('27 minutes 59 seconds');
            expect(formatTimeInterval(27 * MINUTE + 59 * SECOND + 59)).toBe('27 minutes 59 seconds');
        });

        it('should display only the number of minutes when the duration is longer than a week but the number of seconds is zero', () => {
            expect(formatTimeInterval(42 * MINUTE)).toBe('42 minutes');
            expect(formatTimeInterval(42 * MINUTE + 59)).toBe('42 minutes');
        });

        it('should display minutes as singular when there is only one minute', () => {
            expect(formatTimeInterval(1 * MINUTE)).toBe('1 minute');
        });

        it('should display the number of seconds when the duration is less than a minute', () => {
            expect(formatTimeInterval(42 * SECOND)).toBe('42 seconds');
            expect(formatTimeInterval(42 * SECOND + 1)).toBe('42 seconds');
        });

        it('should display seconds as singular when there is only one second', () => {
            expect(formatTimeInterval(1 * SECOND)).toBe('1 second');
        });

        it('should display the rounded amouth of millisecondd up to the second', () => {
            expect(formatTimeInterval(999)).toBe('1 second');
            expect(formatTimeInterval(500)).toBe('1 second');
            expect(formatTimeInterval(499)).toBe('0 seconds');
            expect(formatTimeInterval(0)).toBe('0 seconds');
        });
    });
});
