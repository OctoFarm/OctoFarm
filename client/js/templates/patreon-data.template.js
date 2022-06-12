export const patreonTemplate = (patreon) => {
    return `
            <div class="col-12 col-sm-6 col-md-3 col-lg-3 text-center">
                <li class="list-group-item">
                    <div class="patreon-user"> <img class="patreon-img" src="${patreon.thumb}"></div>
                    <i style="color:gold;" class="fas fa-trophy"></i>
                        ${patreon.name}
                    <i style="color:gold;" class="fas fa-trophy"></i>
                </li>
            </div>
        `
}