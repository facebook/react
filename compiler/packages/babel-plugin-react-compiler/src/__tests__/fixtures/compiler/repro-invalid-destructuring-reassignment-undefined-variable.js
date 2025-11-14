// @flow
'use strict';

component Calendar(user, defaultFirstDay, currentDate, view) {
  const weekendDays = getWeekendDays(user);
  let firstDay = defaultFirstDay;
  let daysToDisplay = 7;
  if (view === 'week') {
    let lastDay;
    // this assignment produces invalid code
    [firstDay, lastDay] = getConfig(weekendDays);
    daysToDisplay = ((7 + lastDay - firstDay) % 7) + 1;
  } else if (view === 'day') {
    firstDay = currentDate.getDayOfWeek();
    daysToDisplay = 1;
  }

  return [currentDate, firstDay, daysToDisplay];
}
