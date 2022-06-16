/**
 * Create a bootstrap single statistics link - needs to be wrapping in a single statistics element
 * @param link
 * @param linkTitle
 * @returns {string}
 */
const getSingleStatLinkTemplate = (link, linkTitle) => {
    if(!!link && !!linkTitle){
        return `
            <h5>
                <a 
                   class="alert-link"
                   rel=”noopener”
                   href="${link}"
                   target="_blank">
                    ${linkTitle}
                </a>
            </h5>
        `
    }
    return "";
}

/**
 * Create a bootstrap single statistics element
 * @param icon
 * @param iconSize
 * @param additionalInformation
 * @param link
 * @param linkTitle
 * @param statSpacing
 * @param type
 * @returns {`
    <div class="alert alert-info text-center" role="alert">
        <div class="vstack gap-1">
            <i class="Provide Icon fa-2xl"></i>
                <span class="${string} mb-0">

                </span>
                ${string}
        </div>
    </div>
    `}
 */
export const getSingleStatTemplate = ({ icon = "Provide Icon", iconSize = "fa-2xl", additionalInformation = "", link = undefined, linkTitle = undefined, statSpacing = 1, type = "info" } = {}) => {
    return `
    <div class="alert alert-${type} text-center" role="alert">
        <div class="vstack gap-${statSpacing}">
            <i class="${icon} ${iconSize}"></i>
            <h5 class="${!!additionalInformation ? "" : "d-none"}">
                ${additionalInformation}
            </h5>
            ${getSingleStatLinkTemplate(link, linkTitle)}
        </div>
    </div>
    `
}
