/**
 * Get last thirty days in a text array
 * @returns {*[]}
 */
export function getLastThirtyDaysText() {
  let today = new Date();
  today = new Date(today);

  let lastThirtyDays = [];
  for (let i = 0; i < 30; i++) {
    let day = (i + 1) * 1000;
    let previousDay = new Date(today - day * 60 * 60 * 24 * 2);
    lastThirtyDays.push(previousDay);
  }

  lastThirtyDays.sort();
  let lastThirtyDaysText = [];
  lastThirtyDays.forEach((day) => {
    lastThirtyDaysText.push(day.getTime());
  });

  return lastThirtyDaysText;
}
