/**
 * Strictly formats a date object or string into Indian Standard Time (IST)
 * to ensure consistency across different device timezones.
 */
export const formatISTDate = (date, options = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-IN', {
      ...options,
      timeZone: 'Asia/Kolkata',
    }).format(d);
  } catch (error) {
    console.error('Error formatting IST date:', error);
    return 'Invalid Date';
  }
};

/**
 * Helper for relative days (Today, Tomorrow) in IST
 */
export const getRelativeISTDay = (dateStr) => {
  if (!dateStr) return 'Today';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    
    const istFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    const dateFormatted = istFormatter.format(d);
    const nowFormatted = istFormatter.format(now);
    
    if (dateFormatted === nowFormatted) return 'Today';
    
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowFormatted = istFormatter.format(tomorrow);
    if (dateFormatted === tomorrowFormatted) return 'Tomorrow';
    
    return formatISTDate(d, { weekday: 'short' });
  } catch (error) {
    return 'Today';
  }
};

/**
 * Strictly formats a time into IST (HH:MM AM/PM)
 */
export const formatISTTime = (date) => {
  if (!date) return '--:--';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    }).format(d);
  } catch (error) {
    return '--:--';
  }
};

/**
 * Returns YYYY-MM-DD string in IST
 */
export const getISTDateString = (date) => {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch (error) {
    console.error('Error getting IST date string:', error);
    return '';
  }
};
