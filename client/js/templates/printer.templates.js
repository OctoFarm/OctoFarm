/**
 * Returns the template for the printer name container
 * @param id
 * @param colour
 * @param position
 */
export const getPrinterNameBadge = (id, colour, position = undefined) => {
    return `
             <button
                
                type="button"
                class="btn mb-0 btn-sm ${position ? "" : "float-left"} btn-block text-truncate text-${position ? position : "left"}"
                role="button"
                style="max-width:${position ? 100 : 65}%;"
                disabled
              >
                <span><i class="fas fa-print" style="color:${colour};"></i></span>
                <span id="name-${id}"></span>
              </button>

    `
}