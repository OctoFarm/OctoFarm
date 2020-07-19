// eslint-disable-next-line max-classes-per-file
import OctoPrintClient from './lib/octoprint.js'
import OctoFarmClient from './lib/octofarm.js'
import UI from './lib/functions/ui.js'
import PrinterManager from './lib/modules/printerManager.js'
import PrinterSettings from './lib/modules/printerSettings.js'
import FileOperations from './lib/functions/file.js'
import Validate from './lib/functions/validate.js'
import PowerButton from './lib/modules/powerButton.js'

let printerInfo = ''
let editMode = false
let deletedPrinters = []
let worker = null
let powerTimer = 20000
let printerControlList = null

if (window.Worker) {
  // Yes! Web worker support!
  try {
    if (worker === null) {
      worker = new Worker('./js/lib/modules/workers/printersManagerWorker.js')
      worker.onmessage = function (event) {
        if (event.data !== false) {
          printerInfo = event.data.printersInformation
          printerControlList = event.data.printerControlList
          if (event.data.printersInformation.length > 0) {
            if (
              document
                .getElementById('printerManagerModal')
                .classList.contains('show')
            ) {
              PrinterManager.init(
                '',
                event.data.printersInformation,
                printerControlList
              )
            } else if (
              document
                .getElementById('printerSettingsModal')
                .classList.contains('show')
            ) {
              PrinterSettings.init(
                '',
                event.data.printersInformation,
                event.data.printerControlList
              )
            } else {
              if (!editMode) {
                dashUpdate.printers(
                  event.data.printersInformation,
                  event.data.printerControlList
                )
              }

              if (powerTimer >= 20000) {
                event.data.printersInformation.forEach((printer) => {
                  PowerButton.applyBtn(printer, 'powerBtn-')
                })
                powerTimer = 0
              } else {
                powerTimer += 500
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
} else {
  // Sorry! No Web Worker support..
  console.log('Web workers not available... sorry!')
}

let newPrintersIndex = 0
// Dash control listeners
const saveEditBtn = document.getElementById('saveEditsBtn')
const editBtn = document.getElementById('editPrinterBtn')
const searchOffline = document.getElementById('searchOfflineBtn')
searchOffline.addEventListener('click', async (e) => {
  searchOffline.innerHTML =
    '<i class="fas fa-redo fa-sm fa-spin"></i> Syncing...'

  const post = await OctoFarmClient.post('printers/reScanOcto', {
    id: null
  })
  searchOffline.innerHTML = '<i class="fas fa-redo fa-sm"></i> Re-Sync'
  UI.createAlert(
    'success',
    'Started a background re-sync of all printers connected to OctoFarm',
    1000,
    'Clicked'
  )
})
saveEditBtn.addEventListener('click', async (event) => {
  const saveEdits = document.getElementById('saveEditsBtn')
  saveEdits.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'
  if (deletedPrinters.length > 0) {
    const post = await OctoFarmClient.post('printers/remove', deletedPrinters)
    if (post.status === 200) {
      let printersRemoved = await post.json()
      printersRemoved = printersRemoved.printersRemoved
      printersRemoved.forEach((printer) => {
        UI.createAlert(
          'success',
          `Printer: ${printer.printerURL} has successfully been removed from the farm...`,
          1000,
          'Clicked'
        )
      })
    } else {
      UI.createAlert(
        'error',
        'Something went wrong updating the Server...',
        3000,
        'Clicked'
      )
      saveButton.innerHTML = '<i class="fas fa-save"></i>'
    }
  }
  let editedPrinters = []
  for (let i = 0; i < printerInfo.length; i++) {
    const printerCard = document.getElementById(
      `printerCard-${printerInfo[i]._id}`
    )
    if (printerCard) {
      const printerURL = document.getElementById(
        `printerURL-${printerInfo[i]._id}`
      )
      const printerCamURL = document.getElementById(
        `printerCamURL-${printerInfo[i]._id}`
      )
      const printerAPIKEY = document.getElementById(
        `printerApiKey-${printerInfo[i]._id}`
      )
      const printerGroup = document.getElementById(
        `printerGroup-${printerInfo[i]._id}`
      )
      const printerName = document.getElementById(
        `printerName-${printerInfo[i]._id}`
      )
      const printer = new PrintersManagement(
        Validate.stripHTML(printerURL.textContent),
        Validate.stripHTML(printerCamURL.textContent),
        Validate.stripHTML(printerAPIKEY.textContent),
        Validate.stripHTML(printerGroup.textContent),
        Validate.stripHTML(printerName.textContent)
      ).build()
      printer._id = printerInfo[i]._id

      const currentInfoIndex = _.findIndex(printerInfo, function (o) {
        return o._id === printerInfo[i]._id
      })
      if (
        printerURL.innerHTML !== printerInfo[currentInfoIndex].printerURL ||
        printerCamURL.innerHTML !== printerInfo[currentInfoIndex].cameraURL ||
        printerAPIKEY.innerHTML !== printerInfo[currentInfoIndex].apikey ||
        printerGroup.innerHTML !== printerInfo[currentInfoIndex].group ||
        printerName.innerHTML !== printerInfo[currentInfoIndex].printerName
      ) {
        editedPrinters.push(printer)
      }
    }
  }
  if (editedPrinters.length > 0) {
    const post = await OctoFarmClient.post('printers/update', editedPrinters)
    if (post.status === 200) {
      let printersAdded = await post.json()
      printersAdded = printersAdded.printersAdded
      printersAdded.forEach((printer) => {
        UI.createAlert(
          'success',
          `Printer: ${printer.printerURL} information has been updated on the farm...`,
          1000,
          'Clicked'
        )
      })
    } else {
      UI.createAlert(
        'error',
        'Something went wrong updating the Server...',
        3000,
        'Clicked'
      )
      saveEdits.innerHTML = '<i class="fas fa-save"></i> Save Edits'
    }
  }

  saveEdits.innerHTML = '<i class="fas fa-save"></i> Save Edits'
  editBtn.classList.remove('d-none')
  saveEditBtn.classList.add('d-none')
  const deleteBtns = document.querySelectorAll("[id^='deleteButton-']")
  deleteBtns.forEach((b) => {
    b.classList.add('d-none')
  })
  if (editedPrinters.length === 0 && deletedPrinters.length === 0) {
    UI.createAlert('warning', "No changes we're made...", 3000, 'Clicked')
  } else {
    UI.createAlert(
      'success',
      'Printer updates have been saved, edit mode now deactivated. <br> Please await your printer list to reload...',
      3000,
      'Clicked'
    )
  }
  const editableFields = document.querySelectorAll('[contenteditable=true]')
  editableFields.forEach((f) => {
    // document.getElementById(f.id).contentEditable = true;
    f.classList.remove('contentEditable')
    f.contentEditable = false
  })
  deletedPrinters = []
  editedPrinters = []
  editMode = false
})
editBtn.addEventListener('click', (event) => {
  editMode = true
  editBtn.classList.add('d-none')
  saveEditBtn.classList.remove('d-none')
  const deleteBtns = document.querySelectorAll("[id^='deleteButton-']")
  deleteBtns.forEach((b) => {
    b.classList.remove('d-none')
  })

  const editableFields = document.querySelectorAll('[contenteditable=false]')

  editableFields.forEach((f) => {
    f.classList.add('contentEditable')
    f.contentEditable = true
  })
  UI.createAlert(
    'success',
    'Edit Mode turned on, press save once finished. <br> Your printer status will not update whilst in this mode...',
    3000,
    'Clicked'
  )
})

document
  .getElementById('exportPrinterBtn')
  .addEventListener('click', (event) => {
    const table = document.getElementById('printerList')
    const printers = new Array()
    for (let r = 0, n = table.rows.length; r < n; r++) {
      const index = table.rows[r].id.split('-')
      const printer = {
        name: document.getElementById(`printerName-${index[1]}`).innerHTML,
        group: document.getElementById(`printerGroup-${index[1]}`).innerHTML,
        printerURL: document.getElementById(`printerURL-${index[1]}`).innerHTML,
        cameraURL: document.getElementById(`printerCamURL-${index[1]}`)
          .innerHTML,
        apikey: document.getElementById(`printerApiKey-${index[1]}`).innerHTML
      }
      printers.push(printer)
    }
    const reFormat = {}
    reFormat.name = []
    reFormat.group = []
    reFormat.printerURL = []
    reFormat.cameraURL = []
    reFormat.apikey = []
    printers.forEach((old) => {
      reFormat.name.push(old.name)
      reFormat.group.push(old.group)
      reFormat.printerURL.push(old.printerURL)
      reFormat.cameraURL.push(old.cameraURL)
      reFormat.apikey.push(old.apikey)
    })
    FileOperations.download('printers.json', JSON.stringify(reFormat))
  })
document
  .getElementById('importPrinterBtn')
  .addEventListener('change', async function () {
    const Afile = this.files
    if (Afile[0].name.includes('.json')) {
      const files = Afile[0]
      const reader = new FileReader()
      reader.onload = await PrintersManagement.importPrinters(files)
      reader.readAsText(files)
    } else {
      // File not json
      UI.createAlert('error', 'File type not .json!', 3000)
    }
  })
document.getElementById('addPrinterBtn').addEventListener('click', (event) => {
  PrintersManagement.addPrinter()
})
class Printer {
  constructor (printerURL, camURL, apikey, group, name) {
    this.settingsAppearance = {
      color: 'default',
      colorTransparent: false,
      defaultLanguage: '_default',
      name,
      showFahrenheitAlso: false
    }
    this.printerURL = printerURL
    this.camURL = camURL
    this.apikey = apikey
    this.group = group
  }
}
class PrintersManagement {
  constructor (printerURL, camURL, apikey, group, name) {
    this.printer = new Printer(printerURL, camURL, apikey, group, name)
  }

  build () {
    return this.printer
  }

  static addPrinter (newPrinter) {
    // Insert Blank Row at top of printer list
    if (
      document.getElementById('printerNewTable').classList.contains('d-none')
    ) {
      document.getElementById('printerNewTable').classList.remove('d-none')
    }

    if (typeof newPrinter !== 'undefined') {
      document.getElementById('printerNewList').insertAdjacentHTML(
        'beforebegin',
        `
         <tr id="newPrinterCard-${newPrintersIndex}">
              <td><div class="Idle" id="newPrinterName-${newPrintersIndex}" contenteditable="true">${newPrinter.name}</div></td>
              <td><div class="Idle" id="newPrinterGroup-${newPrintersIndex}" contenteditable="true">${newPrinter.group}</div></td>
              <td><div class="Idle" id="newPrinterURL-${newPrintersIndex}" contenteditable="true">${newPrinter.printerURL}</td>
              <td><div class="Idle" id="newPrinterCamURL-${newPrintersIndex}" contenteditable="true">${newPrinter.cameraURL}</div></td>
              <td><div class="Idle" id="newPrinterAPIKEY-${newPrintersIndex}" contenteditable="true" >${newPrinter.apikey}</div></td>
              <td><button id="saveButton-${newPrintersIndex}" type="button" class="btn btn-success btn-sm">
                      <i class="fas fa-save"></i>
                  </button></td>
              <td><button id="delButton-${newPrintersIndex}" type="button" class="btn btn-danger btn-sm">
                      <i class="fas fa-trash"></i>
                  </button></td>
      
          </tr>
  `
      )
    } else {
      document.getElementById('printerNewList').insertAdjacentHTML(
        'beforebegin',
        `
        <tr id="newPrinterCard-${newPrintersIndex}">
        <td><div class="Idle" id="newPrinterName-${newPrintersIndex}" contenteditable="true">{Leave to Grab from OctoPrint}</div></td>
        <td><div class="Idle" id="newPrinterGroup-${newPrintersIndex}" contenteditable="true"></div></td>
        <td><div class="Idle" id="newPrinterURL-${newPrintersIndex}" contenteditable="true"></td>
        <td><div class="Idle" id="newPrinterCamURL-${newPrintersIndex}" contenteditable="true">{Set blank to grab from OctoPrint}</div></td>
        <td><div class="Idle" id="newPrinterAPIKEY-${newPrintersIndex}" contenteditable="true" ></div></td>
        <td><button id="saveButton-${newPrintersIndex}" type="button" class="btn btn-success btn-sm">
                <i class="fas fa-save"></i>
            </button></td>
        <td><button id="delButton-${newPrintersIndex}" type="button" class="btn btn-danger btn-sm">
                <i class="fas fa-trash"></i>
            </button></td>

    </tr>
  `
      )
    }
    document
      .getElementById(`saveButton-${newPrintersIndex}`)
      .addEventListener('click', (event) => {
        PrintersManagement.savePrinter(event.target)
      })
    document
      .getElementById(`delButton-${newPrintersIndex}`)
      .addEventListener('click', (event) => {
        PrintersManagement.deletePrinter(event.target)
        newPrintersIndex--
      })
    const printerName = document.getElementById(
      `newPrinterName-${newPrintersIndex}`
    )
    printerName.addEventListener('focus', (event) => {
      printerName.innerHTML = ''
    })
    const printerCamURL = document.getElementById(
      `newPrinterCamURL-${newPrintersIndex}`
    )
    printerCamURL.addEventListener('focus', (event) => {
      printerCamURL.innerHTML = ''
    })
    newPrintersIndex++
  }

  static async importPrinters () {
    return function (e) {
      const theBytes = e.target.result // .split('base64,')[1];
      // Initial JSON validation
      if (Validate.JSON(theBytes)) {
        // If we can parse the file.
        // Grab uploaded file contents into an object
        const importPrinters = JSON.parse(theBytes)
        // Check if old import/new import
        let currentImportList = []
        if ('ip' in importPrinters) {
          // Convert import old to new
          if (
            importPrinters.ip.length === importPrinters.port.length &&
            importPrinters.ip.length === importPrinters.port.length &&
            importPrinters.ip.length === importPrinters.apikey.length
          ) {
            const z = {}
            z.printerURL = []
            z.cameraURL = []
            z.name = []
            z.group = []
            z.apikey = []
            for (let index = 0; index < importPrinters.ip.length; index++) {
              z.printerURL.push(
                `http://${importPrinters.ip[index]}:${importPrinters.port[index]}`
              )
              z.cameraURL.push(importPrinters.camURL[index])
              z.name.push('{Leave to Grab from OctoPrint}')
              z.group.push('')
              z.apikey.push(importPrinters.apikey[index])
            }
            currentImportList = z
          } else {
            UI.createAlert(
              'error',
              'The file you have tried to upload is missing a value.',
              3000
            )
          }
        } else if (
          importPrinters.printerURL.length === importPrinters.name.length &&
          importPrinters.printerURL.length === importPrinters.group.length &&
          importPrinters.printerURL.length === importPrinters.apikey.length &&
          importPrinters.printerURL.length === importPrinters.cameraURL.length
        ) {
          currentImportList = importPrinters
        } else {
          UI.createAlert(
            'error',
            'The file you have tried to upload is missing a value.',
            3000
          )
        }
        for (
          let index = 0;
          index < currentImportList.printerURL.length;
          index++
        ) {
          const printer = {
            printerURL: currentImportList.printerURL[index],
            cameraURL: currentImportList.cameraURL[index],
            name: currentImportList.name[index],
            group: currentImportList.group[index],
            apikey: currentImportList.apikey[index]
          }
          PrintersManagement.addPrinter(printer)
        }
        UI.createAlert(
          'success',
          'Successfully imported your printer list, Please check it over and save when ready.',
          3000
        )
      } else {
        UI.createAlert(
          'error',
          'The file you have tried to upload contains json syntax errors.',
          3000
        )
      }
    }
  }

  static deletePrinter (event) {
    if (editMode) {
      bootbox.confirm({
        message:
          'Are you sure you want to delete your printer? This will mark your printer for deletion and action on save..',
        buttons: {
          confirm: {
            label: 'Yes',
            className: 'btn-success'
          },
          cancel: {
            label: 'No',
            className: 'btn-danger'
          }
        },
        async callback (result) {
          if (result) {
            const ca = event.id.split('-')
            deletedPrinters.push(ca[1])
            document.getElementById(`printerCard-${ca[1]}`).remove()
          }
        }
      })
    } else {
      event.parentElement.parentElement.parentElement.remove()
    }
    const table = document.getElementById('printerNewTable')
    console.log(table.rows.length)
    if (table.rows.length === 1) {
      if (!table.classList.contains('d-none')) {
        table.classList.add('d-none')
      }
    }
  }

  static async savePrinter (event) {
    // Gather the printer data...
    let newId = event.id.split('-')
    newId = newId[1]

    // Grab new printer cells...
    const printerURL = document.getElementById(`newPrinterURL-${newId}`)
    const printerCamURL = document.getElementById(`newPrinterCamURL-${newId}`)
    const printerAPIKEY = document.getElementById(`newPrinterAPIKEY-${newId}`)
    const printerGroup = document.getElementById(`newPrinterGroup-${newId}`)
    const printerName = document.getElementById(`newPrinterName-${newId}`)

    const errors = []
    let printCheck = -1
    if (printerURL.innerHTML !== '') {
      printCheck = _.findIndex(printerInfo, function (o) {
        return o.printerURL.includes(printerURL.innerHTML)
      })
    }
    // Check information is filled correctly...
    if (
      printerURL.innerHTML === '' ||
      printCheck > -1 ||
      printerAPIKEY.innerHTML === '' ||
      printerName.innerHTML === '' ||
      printerCamURL.innerHTML === ''
    ) {
      if (printerURL.innerHTML === '') {
        errors.push({ type: 'warning', msg: 'Please input your printers URL' })
      }
      if (printerAPIKEY.innerHTML === '') {
        errors.push({
          type: 'warning',
          msg: 'Please input your printers API Key'
        })
      }
      if (printerName.innerHTML === '') {
        errors.push({
          type: 'warning',
          msg: 'Please input your printers name'
        })
      }
      if (printCheck > -1) {
        errors.push({
          type: 'error',
          msg: `Printer URL: ${printerURL.innerHTML} already exists on farm`
        })
      }
    }
    if (errors.length > 0) {
      errors.forEach((error) => {
        UI.createAlert(error.type, error.msg, 3000, 'clicked')
      })
    } else {
      const printers = []
      const saveButton = document.getElementById(`saveButton-${newId}`)
      saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'
      saveButton.disabled = true
      const printer = new PrintersManagement(
        printerURL.innerHTML,
        printerCamURL.innerHTML,
        printerAPIKEY.innerHTML,
        printerGroup.innerHTML,
        printerName.innerHTML
      ).build()
      printers.push(printer)
      const post = await OctoFarmClient.post('printers/add', printers)
      if (post.status === 200) {
        let printersAdded = await post.json()
        printersAdded = printersAdded.printersAdded
        printersAdded.forEach((printer) => {
          UI.createAlert(
            'success',
            `Printer: ${printer.printerURL} has successfully been added to the farm...`,
            500,
            'Clicked'
          )
        })
        event.parentElement.parentElement.parentElement.remove()
      } else {
        UI.createAlert(
          'error',
          'Something went wrong updating the Server...',
          3000,
          'Clicked'
        )
        saveButton.innerHTML = '<i class="fas fa-save"></i>'
        saveButton.disabled = false
      }
    }
    const table = document.getElementById('printerNewTable')
    if (table.rows.length === 1) {
      if (!table.classList.contains('d-none')) {
        table.classList.add('d-none')
      }
    }
  }
}

// Initial listeners
document.getElementById('connectAllBtn').addEventListener('click', () => {
  dashActions.connectAll()
})
document.getElementById('disconnectAllBtn').addEventListener('click', () => {
  dashActions.disconnectAll()
})

class dashActions {
  static async connectionAction (action) {
    $('#connectionModal').modal('hide')
    const selected = document.querySelectorAll("[id^='printerSel-']")
    document.getElementById('connectionAction').remove()
    if (action === 'connect') {
      for (let i = 0; i < selected.length; i++) {
        if (selected[i].checked === true) {
          const index = selected[i].id.replace('printerSel-', '')
          let printerName = ''
          if (typeof printerInfo[index].settingsAppearance !== 'undefined') {
            printerName = printerInfo[index].settingsAppearance.name
          }
          let preferBaud = printerInfo[index].options.baudratePreference
          let preferPort = printerInfo[index].options.portPreference
          let preferProfile =
            printerInfo[index].options.printerProfilePreference
          if (preferBaud === null) {
            preferBaud = '115200'
          }
          if (preferPort === null) {
            preferPort = printerInfo[index].options.ports[0]
          }
          if (preferProfile === null) {
            preferProfile = printerInfo[index].options.printerProfiles[0]
          }
          const opts = {
            command: 'connect',
            port: preferPort,
            baudrate: parseInt(preferPort),
            printerProfile: preferProfile,
            save: true
          }
          let post = null
          try {
            post = await OctoPrintClient.post(
              printerInfo[index],
              'connection',
              opts
            )
            if (post.status === 204) {
              UI.createAlert(
                'success',
                `Connected: ${printerInfo[index].index}. ${printerName}`,
                1000,
                'clicked'
              )
            } else {
              UI.createAlert(
                'error',
                `Couldn't Connect ${printerInfo[index].index}with Port: ${preferPort}, Baud: ${preferBaud}, Profile: ${preferProfile}`,
                1000,
                'clicked'
              )
            }
          } catch (e) {
            console.log(e)
            UI.createAlert(
              'error',
              `Couldn't Connect ${printerInfo[index].index}with Port: ${preferPort}, Baud: ${preferBaud}, Profile: ${preferProfile}`,
              1000,
              'clicked'
            )
          }
        }
      }
    } else if (action === 'disconnect') {
      for (let i = 0; i < selected.length; i++) {
        if (selected[i].checked === true) {
          const index = selected[i].id.replace('printerSel-', '')
          let printerName = ''
          if (typeof printerInfo[index].settingsAppearance !== 'undefined') {
            printerName = printerInfo[index].settingsAppearance.name
          }
          const opts = {
            command: 'disconnect'
          }
          const post = await OctoPrintClient.post(
            printerInfo[index],
            'connection',
            opts
          )
          if (post.status === 204) {
            UI.createAlert(
              'success',
              `Disconnected: ${printerInfo[index].index}. ${printerName}`,
              1000,
              'clicked'
            )
          } else {
            UI.createAlert(
              'error',
              `Couldn't Disconnect: ${printerInfo[index].index}. ${printerName}`,
              1000,
              'clicked'
            )
          }
        }
      }
    }
  }

  static async connectAll () {
    // Create bootbox confirmation message
    document.getElementById('connectionActionBtn').insertAdjacentHTML(
      'beforeBegin',
      `
    <button id="connectionAction" type="button" class="btn btn-success" data-dismiss="modal">
      Connect All
    </button>
    `
    )
    const message = document.getElementById('printerConnection')

    message.innerHTML =
      'You must have at least 1 printer in the Disconnected state to use this function...'

    let printersList = ''
    printerInfo.forEach((printer) => {
      if (printer.state === 'Disconnected') {
        let printerName = ''
        if (typeof printer.settingsAppearance !== 'undefined') {
          printerName = printer.settingsAppearance.name
        }
        const print = `
          <div style="display:inline-block;">
          <form class="was-validated">
          <div class="custom-control custom-checkbox mb-3">
            <input type="checkbox" class="custom-control-input" id="printerSel-${printer.index}" required>
            <label class="custom-control-label" for="printerSel-${printer.index}">${printer.index}. ${printerName}</label>
            <div class="valid-feedback">Attempt to connect</div>
            <div class="invalid-feedback">DO NOT connect</div>
          </div>
        </form></div>
          `
        printersList += print
        message.innerHTML = printersList
      }
    })
    const checkBoxes = document.querySelectorAll("[id^='printerSel-']")
    checkBoxes.forEach((box) => {
      box.checked = true
    })
    document
      .getElementById('connectionAction')
      .addEventListener('click', () => {
        dashActions.connectionAction('connect')
      })
  }

  static async disconnectAll () {
    // Create bootbox confirmation message
    document.getElementById('connectionActionBtn').insertAdjacentHTML(
      'beforeBegin',
      `
        <button id="connectionAction" type="button" class="btn btn-success" data-dismiss="modal">
          Disconnect All
        </button>
        `
    )
    const message = document.getElementById('printerConnection')
    message.innerHTML =
      'You must have at least 1 printer in the Idle category to use this function...'
    let printersList = ''
    printerInfo.forEach((printer) => {
      if (
        printer.stateColour.category === 'Idle' ||
        printer.stateColour.category === 'Complete'
      ) {
        let printerName = ''
        if (typeof printer.settingsAppearance !== 'undefined') {
          printerName = printer.settingsAppearance.name
        }
        const print = `
              <div style="display:inline-block;">
              <form class="was-validated">
              <div class="custom-control custom-checkbox mb-3">
                <input type="checkbox" class="custom-control-input" id="printerSel-${printer.index}" required>
                <label class="custom-control-label" for="printerSel-${printer.index}">${printer.index}. ${printerName}</label>
                <div class="valid-feedback">Attempt to connect</div>
                <div class="invalid-feedback">DO NOT connect</div>
              </div>
            </form></div>
              `
        printersList += print
        message.innerHTML = printersList
      }
    })

    const checkBoxes = document.querySelectorAll("[id^='printerSel-']")
    checkBoxes.forEach((box) => {
      box.checked = true
    })
    document
      .getElementById('connectionAction')
      .addEventListener('click', () => {
        dashActions.connectionAction('disconnect')
      })
  }
}

class dashUpdate {
  static printers (printers, printerControlList) {
    printers.forEach((printer) => {
      let printerName = ''
      if (typeof printer.printerState !== 'undefined') {
        if (typeof printer.printerName !== 'undefined') {
          printerName = printer.printerName
        }
        const printerCard = document.getElementById(
          `printerCard-${printer._id}`
        )
        if (printerCard) {
          const printName = document.getElementById(
            `printerName-${printer._id}`
          )
          const printButton = document.getElementById(
            `printerButton-${printer._id}`
          )
          const settingButton = document.getElementById(
            `printerSettings-${printer._id}`
          )
          const webButton = document.getElementById(
            `printerWeb-${printer._id}`
          )
          const hostBadge = document.getElementById(`hostBadge-${printer._id}`)
          const printerBadge = document.getElementById(
            `printerBadge-${printer._id}`
          )
          const socketBadge = document.getElementById(
            `webSocketIcon-${printer._id}`
          )
          const printerGroup = document.getElementById(
            `printerGroup-${printer._id}`
          )
          const printerURL = document.getElementById(
            `printerURL-${printer._id}`
          )
          const printerCameraURL = document.getElementById(
            `printerCamURL-${printer._id}`
          )
          const printerAPIKey = document.getElementById(
            `printerApiKey-${printer._id}`
          )
          const printerOctoPrintVersion = document.getElementById(
            `printerOctoPrintVersion-${printer._id}`
          )
          const printerSortIndex = document.getElementById(
            `printerSortIndex-${printer._id}`
          )
          printerSortIndex.innerHTML = printer.sortIndex
          printerGroup.innerHTML = printer.group
          printerURL.innerHTML = printer.printerURL
          printerAPIKey.innerHTML = printer.apikey
          if (printer.camURL === 'none') {
            printerCameraURL.innerHTML = ''
          } else {
            printerCameraURL.innerHTML = printer.cameraURL
          }

          printerOctoPrintVersion.innerHTML = printer.octoPrintVersion

          printName.innerHTML = `${printerName}`
          printerBadge.innerHTML = printer.printerState.state
          printerBadge.className = `tag badge badge-${printer.printerState.colour.name} badge-pill`
          printerBadge.setAttribute('title', printer.printerState.desc)
          hostBadge.innerHTML = printer.hostState.state
          hostBadge.setAttribute('title', printer.hostState.desc)
          hostBadge.className = `tag badge badge-${printer.hostState.colour.name} badge-pill`
          socketBadge.className = `tag badge badge-${printer.webSocketState.colour} badge-pill`
          socketBadge.setAttribute('title', printer.webSocketState.desc)
          webButton.href = printer.printerURL
          if (printer.printerState.colour.category === 'Offline') {
            printButton.disabled = true
            settingButton.disabled = true
          } else {
            printButton.disabled = false
            settingButton.disabled = false
          }
        } else {
          // Insert new printer addition...
          document.getElementById('printerList').insertAdjacentHTML(
            'beforeend',
            `
        <tr id="printerCard-${printer._id}">
        <th id="printerSortIndex-${printer._id}">${printer.sortIndex}</td>
        <td class="d-none">
            <center>
            <form class="was-validated form-check-inline form-check d-none">
                <div class="custom-control custom-checkbox mb-2 pr-2">
                    <input type="checkbox" class="custom-control-input" id="dashboardSelect-${printer._id}" required>
                    <label class="custom-control-label" for="dashboardSelect-${printer._id}"></label>
                </div>
            </form>
            </center>
        </td>
        <td><div id="printerName-${printer._id}" contenteditable="false">${printerName}</div></td>
        <td>
            <button  
            title="Control Your Printer"
            id="printerButton-${printer._id}"
                     type="button"
                     class="tag btn btn-primary btn-sm"
                     data-toggle="modal"
                     data-target="#printerManagerModal" disabled
            ><i class="fas fa-print"></i>
            </button>
            <button  title="Change your Printer Settings"
            id="printerSettings-${printer._id}"
                                 type="button"
                                 class="tag btn btn-secondary btn-sm"
                                 data-toggle="modal"
                                 data-target="#printerSettingsModal" disabled
            ><i class="fas fa-cog"></i>
            </button>
            <a title="Open your Printers Web Interface"
               id="printerWeb-${printer._id}"
               type="button"
               class="tag btn btn-info btn-sm"
               target="_blank"
               href="${printer.printerURL}" role="button"><i class="fas fa-globe-europe"></i></a>
            <button  
                     title="Re-Sync your printer"
                     id="printerSyncButton-${printer._id}"
                     type="button"
                     class="tag btn btn-success btn-sm"
            >
                <i class="fas fa-sync"></i>
            </button>
            <div id="powerBtn-${printer._id}" class="btn-group">

            </div>
            <span title="Drag and Change your Printers sorting"  id="printerSortButton-${printer._id}"
                   class="tag btn btn-light btn-sm sortableList"
            >
    <i class="fas fa-grip-vertical"></i>
    </span></td>
        <td><small><span data-title="${printer.hostState.desc}" id="hostBadge-${printer._id}" class="tag badge badge-${printer.hostState.colour.name} badge-pill">
                ${printer.hostState.state}</small></span></td>
        <td><small><span data-title="${printer.printerState.desc}" id="printerBadge-${printer._id}" class="tag badge badge-${printer.printerState.colour.name} badge-pill">
                ${printer.printerState.state}</small></span></td>
        <td><small><span data-title="${printer.webSocketState.desc}" id="webSocketIcon-${printer._id}" class="tag badge badge-${printer.webSocketState.colour} badge-pill">
                <i  class="fas fa-plug"></i></span></td>
   
        <td><div id="printerGroup-${printer._id}" contenteditable="false"></div></td>
        <td><div id="printerURL-${printer._id}" contenteditable="false"></div></td>
        <td><div id="printerCamURL-${printer._id}" contenteditable="false"></div></td>
        <td><div id="printerApiKey-${printer._id}" contenteditable="false"></div></td>
        <th id="printerOctoPrintVersion-${printer._id}"></td>
        
        <td><button id="deleteButton-${printer._id}" type="button" class="btn btn-danger btn-sm d-none">
                <i class="fas fa-trash"></i>
            </button></td>
    </tr>
          `
          )
          PowerButton.applyBtn(printer, 'powerBtn-')
          document
            .getElementById(`deleteButton-${printer._id}`)
            .addEventListener('click', (event) => {
              PrintersManagement.deletePrinter(event.target)
            })
          document
            // eslint-disable-next-line no-underscore-dangle
            .getElementById(`printerSyncButton-${printer._id}`)
            .addEventListener('click', async (e) => {
              e.target.innerHTML = "<i class='fas fa-sync fa-spin'></i>"
              e.target.disabled = true
              const data = {
                id: printer._id
              }
              let post = await OctoFarmClient.post('printers/reScanOcto', data)
              post = await post.json()
              if (post.msg.status !== 'error') {
                UI.createAlert('success', post.msg.msg, 3000, 'clicked')
              } else {
                UI.createAlert('error', post.msg.msg, 3000, 'clicked')
              }

              e.target.innerHTML = "<i class='fas fa-sync'></i>"
              e.target.disabled = false
            })
          document
            .getElementById(`printerButton-${printer._id}`)
            .addEventListener('click', () => {
              // eslint-disable-next-line no-underscore-dangle
              PrinterManager.init(printer._id, printerInfo, printerControlList)
            })
          document
            .getElementById(`printerSettings-${printer._id}`)
            .addEventListener('click', (e) => {
              PrinterSettings.init(
                // eslint-disable-next-line no-underscore-dangle
                printer._id,
                printerInfo,
                printerControlList
              )
            })
        }
      }
    })
  }
}
const el = document.getElementById('printerList')
const sortable = Sortable.create(el, {
  handle: '.sortableList',
  animation: 150,
  onUpdate (/** Event */ e) {
    const elements = e.target.querySelectorAll("[id^='printerCard-']")
    const listID = []
    elements.forEach((e) => {
      const ca = e.id.split('-')
      listID.push(ca[1])
    })
    OctoFarmClient.post('printers/updateSortIndex', listID)
  }
})
