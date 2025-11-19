/**
 * Date utility functions for naval letter formatting
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Converts various date formats to naval format (DD MMM YY)
 * Supports: Naval format, ISO dates, MM/DD/YYYY, YYYYMMDD, "today", "now"
 *
 * @param dateString - The date string to format
 * @returns Formatted date in naval format (e.g., "15 Jan 24")
 */
export function parseAndFormatDate(dateString: string): string {
  // If already in Naval format, return as-is
  const navalPattern = /^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2}$/i;
  if (navalPattern.test(dateString)) {
    return dateString;
  }

  let date: Date | null = null;

  // Handle various date formats
  if (dateString.toLowerCase() === 'today' || dateString.toLowerCase() === 'now') {
    date = new Date();
  } else if (/^\d{8}$/.test(dateString)) {
    // YYYYMMDD format
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  } else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateString)) {
    // ISO format YYYY-MM-DD
    date = new Date(dateString);
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
    // MM/DD/YYYY format
    const parts = dateString.split('/');
    date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
  } else {
    // Try generic Date parsing
    try {
      const parsedDate = new Date(dateString);
      if (!isNaN(parsedDate.getTime())) {
        date = parsedDate;
      }
    } catch (e) {
      // ignore invalid date strings
    }
  }

  // If parsing failed, return original string
  if (!date || isNaN(date.getTime())) {
    return dateString;
  }

  // Format to naval format
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear().toString().slice(-2);

  return `${day} ${month} ${year}`;
}

/**
 * Gets today's date in naval format
 *
 * @returns Today's date formatted as "DD MMM YY"
 */
export function getTodaysDate(): string {
  const today = new Date();
  const navyDate = today.getDate() + ' ' + MONTHS[today.getMonth()] + ' ' + today.getFullYear().toString().slice(-2);
  return navyDate;
}
