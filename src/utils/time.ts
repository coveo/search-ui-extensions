import { l } from 'coveo-search-ui';

/**
 * Format a date object to a date string that follow the format describe below.
 * > Ex: `Mon, 29 Apr 2019`
 * @param date The date that will be formated.
 * @returns A string formated version of the date.
 */
export function formatDate(date: Date) {
    const formattedDate = date.toLocaleDateString('default', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    const dateArray = formattedDate.split(',').map(subtring => subtring.trim());
    const dateSection = dateArray[1].split(' ');
    const dateSectionString = `${dateSection[1]} ${dateSection[0]}`;
    return `${dateArray[0]}, ${dateSectionString} ${dateArray[2]}`;
}

/**
 * Format a date object to a time string that follow the format describe below.
 * > Ex: `12:00:00 PM`
 * @param date The date that will be formated.
 * @returns A string formated version of the time.
 */
export function formatTime(date: Date) {
    return date.toLocaleTimeString('default', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

/**
 * Format a date object to a date and time string that follow the format describe below.
 * > Ex: `Mon, 29 April 2019 - 12:00:00 PM`
 * @param date The date that will be formated.
 * @returns A string formated version of the date and time.
 */
export function formatDateAndTime(date: Date) {
    return `${formatDate(date)} - ${formatTime(date)}`;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * Format a time interval to a user friendly string format.
 * > Ex: `5 minutes 10 seconds`
 * @param interval The time interval in milliseconds to format in a user friendly fashion.
 */
export function formatTimeInterval(interval: number): string {
    const string_index = 1;
    const nb_seconds = Math.floor(Math.round((interval % MINUTE) / SECOND));
    const nb_minutes = Math.floor((interval % HOUR) / MINUTE);
    const nb_hour = Math.floor((interval % DAY) / HOUR);
    const nb_day = Math.floor((interval % WEEK) / DAY);
    const nb_week = Math.floor(interval / WEEK);

    const formater = (nb: number, unit: string) => `${nb} ${unit}${nb === 1 ? '' : 's'}`;

    const seconds_str = formater(nb_seconds, l('second'));
    const minutes_str = formater(nb_minutes, l('minute'));
    const hour_str = formater(nb_hour, l('hour'));
    const day_str = formater(nb_day, l('day'));
    const week_str = formater(nb_week, l('week'));

    const time_per_unit = [
        [nb_week, `${week_str}${nb_day > 0 ? ` ${day_str}` : ''}`],
        [nb_day, `${day_str}${nb_hour > 0 ? ` ${hour_str}` : ''}`],
        [nb_hour, `${hour_str}${nb_minutes > 0 ? ` ${minutes_str}` : ''}`],
        [nb_minutes, `${minutes_str}${nb_seconds > 0 ? ` ${seconds_str}` : ''}`],
        [nb_seconds, seconds_str]
    ];

    const first_meaningful_tuple = (time_per_unit.find(([amount, _]) => amount > 0) as [number, string]) || [0, '0 seconds'];

    return first_meaningful_tuple[string_index];
}
