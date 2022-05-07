/**
 * Returns the template for the printer name container
 * @param id
 * @param colour
 * @param position
 */
export const getPrinterNameBadge = (id, colour, position = undefined) => {
  return `
             <span
                class="btn mb-0 btn-sm ${
                  position ? "" : "float-left"
                } btn-block text-truncate text-${position ? position : "left"}"
                role="button"
                style="max-width:${position ? 100 : 60}%;"

              >
                <i title="Printers power state" id="powerState-${id}" class="fa-solid fa-power-off fa-2 d-none"></i>    
                <i title="Klippers state" id="klipperState-${id}" class="fa-solid fa-scissors fa-2 d-none"></i>          
                <span><i class="fas fa-print" style="color:${colour};"></i></span>
                <span id="name-${id}"></span>
              </span>

    `;
};
