const AttendanceSettings = require('../models/AttendanceSettings');
const Holiday = require('../models/Holiday');

/**
 * Day-of-week for a YYYY-MM-DD string, using pure calendar math — NOT Date.getDay(),
 * which depends on the server process's local timezone and can drift near midnight.
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {number} 0=Sunday ... 6=Saturday
 */
const dayOfWeek = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

/**
 * Determine whether a single YYYY-MM-DD (IST calendar date) is a working day.
 * @param {string} dateStr
 * @param {object} [settings] - Optional pre-fetched AttendanceSettings.getSettings() result
 * @returns {Promise<{isWorkingDay: boolean, reason: 'weekly-off'|'holiday'|null, holidayName: string|null}>}
 */
const getDayType = async (dateStr, settings = null) => {
  const s = settings || (await AttendanceSettings.getSettings());
  const weeklyOffDays = s.weeklyOffDays?.length ? s.weeklyOffDays : [0];

  if (weeklyOffDays.includes(dayOfWeek(dateStr))) {
    return { isWorkingDay: false, reason: 'weekly-off', holidayName: null };
  }

  const mmdd = dateStr.substring(5); // 'MM-DD'
  const holiday = await Holiday.findOne({
    $or: [{ date: dateStr }, { recurringAnnually: true, date: { $regex: `-${mmdd}$` } }],
  }).lean();

  if (holiday) {
    return { isWorkingDay: false, reason: 'holiday', holidayName: holiday.name };
  }

  return { isWorkingDay: true, reason: null, holidayName: null };
};

/**
 * Bulk variant for month/range-based calculations (monthly hours, calendar rendering).
 * Avoids N+1 queries — fetches all holidays touching the range once, computes the rest in memory.
 * @param {string} startDate - YYYY-MM-DD inclusive
 * @param {string} endDate - YYYY-MM-DD inclusive
 * @param {object} [settings]
 * @returns {Promise<Map<string, {reason: 'weekly-off'|'holiday', holidayName: string|null}>>}
 *          Map of non-working dateStr -> reason. Dates not present in the map are working days.
 */
const getNonWorkingDaysInRange = async (startDate, endDate, settings = null) => {
  const s = settings || (await AttendanceSettings.getSettings());
  const weeklyOffDays = s.weeklyOffDays?.length ? s.weeklyOffDays : [0];

  const specificHolidays = await Holiday.find({
    date: { $gte: startDate, $lte: endDate },
  }).lean();
  const recurringHolidays = await Holiday.find({ recurringAnnually: true }).lean();

  const result = new Map();

  // Walk every date in range once
  const [y, m, d] = startDate.split('-').map(Number);
  const cursor = new Date(Date.UTC(y, m - 1, d));
  const [ey, em, ed] = endDate.split('-').map(Number);
  const end = new Date(Date.UTC(ey, em - 1, ed));

  while (cursor <= end) {
    const ds = cursor.toISOString().split('T')[0];
    const dow = cursor.getUTCDay();
    const mmdd = ds.substring(5);

    if (weeklyOffDays.includes(dow)) {
      result.set(ds, { reason: 'weekly-off', holidayName: null });
    } else {
      const exact = specificHolidays.find((h) => h.date === ds);
      const recurring = recurringHolidays.find((h) => h.date.substring(5) === mmdd);
      const match = exact || recurring;
      if (match) result.set(ds, { reason: 'holiday', holidayName: match.name });
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return result;
};

module.exports = { getDayType, getNonWorkingDaysInRange, dayOfWeek };
