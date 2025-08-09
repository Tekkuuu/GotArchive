import { startOfWeek, endOfWeek, format } from 'date-fns';

/**
 * Formats a week range into a human-readable string.
 * @param year - The year of the week.
 * @param weekIndex - The ISO week number (1–53).
 * @returns A formatted string like "Week {weekIndex}, {day}-{day} {monthName}" or 
 *          "Week {weekIndex}, {day} {monthName} - {day} {monthName}".
 */
export function formatWeekRange(year: number, weekIndex: number): string {
  const janFirst = new Date(year, 0, 1); // January 1st of the given year
  const startDate = startOfWeek(janFirst, { weekStartsOn: 1 }); // Week starts on Monday
  startDate.setDate(startDate.getDate() + (weekIndex - 1) * 7);
  const endDate = endOfWeek(startDate, { weekStartsOn: 1 });

  const startDay = format(startDate, 'd');
  const startMonth = format(startDate, 'LLLL'); // Full month name
  const endDay = format(endDate, 'd');
  const endMonth = format(endDate, 'LLLL');

  if (startMonth === endMonth) {
    // Both dates are in the same month
    return `Week ${weekIndex}, ${startDay}-${endDay} ${startMonth}`;
  } else {
    // Dates span different months
    return `Week ${weekIndex}, ${startDay} ${startMonth} - ${endDay} ${endMonth}`;
  }
}
