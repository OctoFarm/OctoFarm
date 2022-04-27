export function checkTemps(element, actual, target, tempTriggers, state) {
  actual = parseFloat(actual);
  target = parseFloat(target);
  if (isNaN(actual)) {
    actual = 0;
  }
  if (isNaN(target)) {
    target = 0;
  }
  if (state === "Complete") {
    if (actual > parseFloat(tempTriggers.coolDown)) {
      const string = `<i class="far fa-circle"></i>&nbsp;${actual}°C&nbsp;<i class="fas fa-bullseye"></i>&nbsp;${target}°C`;
      if (element && element.innerHTML !== string) {
        element.innerHTML = string;
      }
    } else {
      const string = `<i class="far fa-circle toolUnder"></i>&nbsp;${actual}°C&nbsp;<i class="fas fa-bullseye toolUnder"></i>&nbsp;${target}°C`;
      if (element && element.innerHTML !== string) {
        element.innerHTML = string;
      }
    }
  } else if (state === "Active") {
    if (
      actual > target - parseFloat(tempTriggers.heatingVariation) &&
      actual < target + parseFloat(tempTriggers.heatingVariation)
    ) {
      const string = `<i class="far fa-circle toolOn"></i>&nbsp;${actual}°C&nbsp;<i class="fas fa-bullseye toolOn"></i>&nbsp;${target}°C`;
      if (element && element.innerHTML !== string) {
        element.innerHTML = string;
      }
    } else if (actual < parseFloat(tempTriggers.heatingVariation)) {
      const string = `<i class="far fa-circle"></i>&nbsp;${actual}°C&nbsp;<i class="fas fa-bullseye"></i>&nbsp;${target}°C`;
      if (element && element.innerHTML !== string) {
        element.innerHTML = string;
      }
    } else {
      const string = `<i class="far fa-circle toolOut"></i>&nbsp;${actual}°C&nbsp;<i class="fas fa-bullseye toolOut"></i>&nbsp;${target}°C`;
      if (element && element.innerHTML !== string) {
        element.innerHTML = string;
      }
    }
  } else {
    const string = `<i class="far fa-circle"></i>&nbsp;${actual}°C&nbsp;<i class="fas fa-bullseye"></i>&nbsp;${target}°C`;
    if (element && element.innerHTML !== string) {
      element.innerHTML = string;
    }
  }
}
