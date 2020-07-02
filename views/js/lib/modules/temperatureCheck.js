export function checkTemps(element, actual, target, tempTriggers, state){
    actual = parseFloat(actual);
    target = parseFloat(target);
    if(state === "Complete"){
        if (actual > parseFloat(tempTriggers.coolDown)) {
            element.innerHTML =
                ' <i class="far fa-circle"></i> ' +
                actual +
                "°C" +
                " " +
                ' <i class="fas fa-bullseye"></i> ' +
                target +
                "°C";
        } else {
            element.innerHTML =
                ' <i class="far fa-circle toolUnder"></i> ' +
                actual +
                "°C" +
                ' <i class="fas fa-bullseye toolUnder"></i> ' +
                target +
                "°C";
        }
    }else if(state === "Active"){
        if (actual > target - parseFloat(tempTriggers.heatingVariation) && actual < target + parseFloat(tempTriggers.heatingVariation)) {
            element.innerHTML =
                ' <i class="far fa-circle toolOn"></i> ' +
                actual +
                "°C" +
                " " +
                ' <i class="fas fa-bullseye toolOn"></i> ' +
                target +
                "°C";
        } else if (actual < parseFloat(tempTriggers.heatingVariation)) {
            element.innerHTML =
                ' <i class="far fa-circle"></i> ' +
                actual +
                "°C" +
                " " +
                ' <i class="fas fa-bullseye"></i> ' +
                target +
                "°C";
        } else {
            element.innerHTML =
                ' <i class="far fa-circle toolOut"></i> ' +
                actual +
                "°C" +
                ' <i class="fas fa-bullseye toolOut"></i> ' +
                target +
                "°C";

        }
    }else{
        element.innerHTML =
            ' <i class="far fa-circle"></i> ' +
            actual +
            "°C" +
            ' <i class="fas fa-bullseye"></i> ' +
            target +
            "°C";

    }
}