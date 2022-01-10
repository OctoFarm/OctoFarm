import UI from "../../../lib/functions/ui"

const appearanceTemplate = (appearance) => {
    let buttonsHTML = "";

    for (const [key, value] of Object.entries(appearance)) {
        console.log(`${key}: ${value}`);
        buttonsHTML += UI.convertValueToTemplate(key, value);
    }

    return `
        <form>
            <div class="row">  
              ${buttonsHTML}
            </div>
        </form>
    `
}

export function populateAppearanceSettings(appearance){
    const appearanceElement = document.getElementById("bulk-appearance-el");
    appearanceElement.innerHTML = appearanceTemplate(appearance)

}