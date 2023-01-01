export const currentOperationsPrinterPanelTemplate = ({ id, name, fileName }) => {

    return `
        <div class="svg-item" id="co-card-${id}">
            <div class="card reveal-hover">
                <div class="co-finished-print-menu bg-dark" style="visibility: hidden; position: absolute; z-index: 1000; top: 0; left:0; height: 100%; width: 100%">
                    <div class="btn-group w-100 h-100" role="group">
                      <button title="Clear your finished print from current operations"  type="button" class="btn btn-outline-success" id="co-harvest-print-${id}" disabled><i class="fa-solid fa-hands-holding-circle"></i><br>Ready</button>
                      <button title="Restart your current selected print" type="button" class="btn btn-outline-warning" id='co-restart-print-${id}' disabled><i class="fa-solid fa-repeat"></i><br>Reprint</button>
                      <button title="Restart your current selected print" type="button" class="btn btn-outline-danger" id='co-cancel-print-${id}' disabled><i class="fa-solid fa-stop"></i><br>Cancel</button>
                    </div>
                </div>
                <div class="card-body border rounded border-0 bg-dark-subtle p-0">
                    <svg width="100%" height="100%" viewBox="0 0 200 50">
                        <circle id="co-print-state-${id}" class="svg-indicator-status" />
                        <circle class="svg-indicator-track" />
                        <circle id="co-progress-${id}" class="svg-indicator-indication" />
                        <circle class="svg-indicator-cut" />
                        <g id="co-icon-state-${id}" class="svg-indicator-status-icon">
                            <svg x="-2%" y="30%" width="16" height="16" class="bi bi-printer" viewBox="0 0 16 16">
                                <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
                                <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2H5zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4V3zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2H5zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1z"/>
                            </svg>
                        </g>
                        <g class="svg-indicator-text">
                            <text>
                                <tspan id="co-printer-name-${id}" x="20%" y="26%">${name}</tspan>
                                <tspan id="co-file-name-${id}" x="20%" y="60%">${fileName}</tspan>
                            </text>
                        </g>
                        <g class="svg-indicator-text-small">
                            <text>
                                <tspan id="co-time-remaining-${id}" x="20%" y="90%">
                                    combobulating...
                                </tspan>
                            </text>
                        </g>
                    </svg>
                </div>
            </div>
        </div>
`
}