export const SERVICE_LEAD_TIME_HOURS = 3;

const getISTNow = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const getPart = (type) => Number(parts.find(part => part.type === type)?.value);
  const hour = getPart('hour');

  return new Date(
    getPart('year'),
    getPart('month') - 1,
    getPart('day'),
    hour === 24 ? 0 : hour,
    getPart('minute'),
    getPart('second')
  );
};

const parseTime = (timeSlot) => {
  const match = String(timeSlot || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return { hour, minute };
};

export const isServiceTimeAllowed = (selectedDate, timeSlot, now = new Date()) => {
  if (!selectedDate || !timeSlot) return false;

  const date = new Date(selectedDate);
  const parsedTime = parseTime(timeSlot);
  if (Number.isNaN(date.getTime()) || !parsedTime) return false;

  const nowIST = getISTNow(now);
  const serviceTimeIST = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    parsedTime.hour,
    parsedTime.minute,
    0,
    0
  );
  const earliestAllowedIST = new Date(
    nowIST.getTime() + SERVICE_LEAD_TIME_HOURS * 60 * 60 * 1000
  );

  return serviceTimeIST.getTime() >= earliestAllowedIST.getTime();
};

export const getAvailableServiceSlots = (selectedDate, slots, maxSlots = 9) => {
  const nineAmIndex = slots.indexOf('09:00 AM');
  const daytimeSlots = nineAmIndex >= 0 ? slots.slice(nineAmIndex) : slots;
  return daytimeSlots
    .filter(slot => isServiceTimeAllowed(selectedDate, slot))
    .slice(0, maxSlots);
};

export const canNavigateToPreviousServiceMonth = (monthDate, now = new Date()) => {
  const currentIST = getISTNow(now);
  const displayedMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const currentMonth = new Date(currentIST.getFullYear(), currentIST.getMonth(), 1);
  return displayedMonth.getTime() > currentMonth.getTime();
};

export const SERVICE_TIME_NOTICE = `Please select a time at least ${SERVICE_LEAD_TIME_HOURS} hours from now.`;
