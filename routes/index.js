const express = require('express')

const router = express.Router()
const { ensureAuthenticated } = require('../config/auth')
const db = require('../config/db').MongoURI
const pjson = require('../package.json')
const ServerSettings = require('../models/ServerSettings.js')
const prettyHelpers = require('../views/partials/functions/pretty.js')
const runner = require('../runners/state.js')

const { Runner } = runner
const _ = require('lodash')

const historyClean = require('../lib/dataFunctions/historyClean.js')

const { HistoryClean } = historyClean
const filamentClean = require('../lib/dataFunctions/filamentClean.js')

const { FilamentClean } = filamentClean
const settingsClean = require('../lib/dataFunctions/settingsClean.js')

const { SettingsClean } = settingsClean
const printerClean = require('../lib/dataFunctions/printerClean.js')

const { PrinterClean } = printerClean
const fileClean = require('../lib/dataFunctions/fileClean.js')

const { FileClean } = fileClean

const version = `${pjson.version}.6.5`
console.log(`Version: ${version}`)
console.log(`db: ${db}`)

// Welcome Page
async function welcome () {
  if (db === '') {
    // No db setup, show db warning before login.
    router.get('/', (req, res) =>
      res.render('database', { page: 'Database Warning' })
    )
  } else {
    const serverSettings = await ServerSettings.find({})
    if (serverSettings[0].server.loginRequired === false) {
      router.get('/', (req, res) => res.redirect('/dashboard'))
    } else {
      const { registration } = serverSettings[0].server
      router.get('/', (req, res) =>
        res.render('welcome', {
          page: 'Welcome',
          registration,
          serverSettings: serverSettings[0]
        })
      )
    }
  }
}
welcome()

// Dashboard Page
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  const printers = await Runner.returnFarmPrinters()
  const serverSettings = await SettingsClean.returnSystemSettings()
  let user = null
  let group = null
  if (serverSettings.server.loginRequired === false) {
    user = 'No User'
    group = 'Administrator'
  } else {
    user = req.user.name
    group = req.user.group
  }
  res.render('dashboard', {
    name: user,
    userGroup: group,
    version,
    printerCount: printers.length,
    page: 'Dashboard',
    helpers: prettyHelpers
  })
})
router.get('/printers', ensureAuthenticated, async (req, res) => {
  const printers = await Runner.returnFarmPrinters()
  const serverSettings = await SettingsClean.returnSystemSettings()
  let user = null
  let group = null
  if (serverSettings.server.loginRequired === false) {
    user = 'No User'
    group = 'Administrator'
  } else {
    user = req.user.name
    group = req.user.group
  }
  res.render('printerManagement', {
    name: user,
    userGroup: group,
    version,
    page: 'Printer Manager',
    printerCount: printers.length,
    helpers: prettyHelpers
  })
})
// File Manager Page
router.get('/filemanager', ensureAuthenticated, async (req, res) => {
  const printers = await Runner.returnFarmPrinters()
  const serverSettings = await SettingsClean.returnSystemSettings()
  const currentOperations = await PrinterClean.returnCurrentOperations()
  const fileStatistics = await FileClean.returnStatistics()
  let user = null
  let group = null
  if (serverSettings.server.loginRequired === false) {
    user = 'No User'
    group = 'Administrator'
  } else {
    user = req.user.name
    group = req.user.group
  }
  res.render('filemanager', {
    name: user,
    userGroup: group,
    version,
    page: 'Printer Manager',
    printerCount: printers.length,
    helpers: prettyHelpers,
    currentOperationsCount: currentOperations.count,
    fileStatistics
  })
})
// History Page
router.get('/history', ensureAuthenticated, async (req, res) => {
  const printers = Runner.returnFarmPrinters()
  const history = await HistoryClean.returnHistory()
  const statistics = await HistoryClean.returnStatistics()
  const serverSettings = await SettingsClean.returnSystemSettings()
  let user = null
  let group = null
  if (serverSettings.server.loginRequired === false) {
    user = 'No User'
    group = 'Administrator'
  } else {
    user = req.user.name
    group = req.user.group
  }
  res.render('history', {
    name: user,
    userGroup: group,
    version,
    printerCount: printers.length,
    history,
    printStatistics: statistics,
    helpers: prettyHelpers,
    page: 'History'
  })
})
// Panel view  Page
router.get('/mon/panel', ensureAuthenticated, async (req, res) => {
  const printers = await Runner.returnFarmPrinters()
  const sortedIndex = await Runner.sortedIndex()
  const clientSettings = await SettingsClean.returnClientSettings()
  const serverSettings = await SettingsClean.returnSystemSettings()
  let user = null
  let group = null
  if (serverSettings.server.loginRequired === false) {
    user = 'No User'
    group = 'Administrator'
  } else {
    user = req.user.name
    group = req.user.group
  }
  res.render('panelView', {
    name: user,
    userGroup: group,
    version,
    printers,
    printerCount: printers.length,
    sortedIndex,
    page: 'Panel View',
    helpers: prettyHelpers,
    clientSettings
  })
})
// Camera view  Page
router.get('/mon/camera', ensureAuthenticated, async (req, res) => {
  const printers = await Runner.returnFarmPrinters()
  const sortedIndex = await Runner.sortedIndex()
  const clientSettings = await SettingsClean.returnClientSettings()
  const serverSettings = await SettingsClean.returnSystemSettings()
  let user = null
  let group = null
  if (serverSettings.server.loginRequired === false) {
    user = 'No User'
    group = 'Administrator'
  } else {
    user = req.user.name
    group = req.user.group
  }
  res.render('cameraView', {
    name: user,
    userGroup: group,
    version,
    printers,
    printerCount: printers.length,
    sortedIndex,
    page: 'Camera View',
    helpers: prettyHelpers,
    clientSettings
  })
})
// List view  Page
router.get('/mon/list', ensureAuthenticated, async (req, res) => {
  const printers = await Runner.returnFarmPrinters()
  const sortedIndex = await Runner.sortedIndex()
  const clientSettings = await SettingsClean.returnClientSettings()
  const serverSettings = await SettingsClean.returnSystemSettings()
  let user = null
  let group = null
  if (serverSettings.server.loginRequired === false) {
    user = 'No User'
    group = 'Administrator'
  } else {
    user = req.user.name
    group = req.user.group
  }
  res.render('listView', {
    name: user,
    userGroup: group,
    version,
    printers,
    printerCount: printers.length,
    sortedIndex,
    page: 'List View',
    helpers: prettyHelpers,
    clientSettings
  })
})
router.get('/mon/currentOp', ensureAuthenticated, async (req, res) => {
  const printers = await Runner.returnFarmPrinters()
  const sortedIndex = await Runner.sortedIndex()
  const clientSettings = await SettingsClean.returnClientSettings()
  const serverSettings = await SettingsClean.returnSystemSettings()
  let user = null
  let group = null
  if (serverSettings.server.loginRequired === false) {
    user = 'No User'
    group = 'Administrator'
  } else {
    user = req.user.name
    group = req.user.group
  }
  res.render('currentOperationsView', {
    name: user,
    userGroup: group,
    version,
    printers,
    printerCount: printers.length,
    sortedIndex,
    page: 'Current Operations',
    helpers: prettyHelpers,
    clientSettings
  })
})
router.get('/filament', ensureAuthenticated, async (req, res) => {
  const printers = Runner.returnFarmPrinters()
  const serverSettings = await SettingsClean.returnSystemSettings()
  const statistics = await FilamentClean.getStatistics()
  const spools = await FilamentClean.getSpools()
  const profiles = await FilamentClean.getProfiles()
  let user = null
  let group = null
  if (serverSettings.server.loginRequired === false) {
    user = 'No User'
    group = 'Administrator'
  } else {
    user = req.user.name
    group = req.user.group
  }
  res.render('filament', {
    name: user,
    userGroup: group,
    version,
    printerCount: printers.length,
    page: 'Filament Manager',
    helpers: prettyHelpers,
    serverSettings,
    spools,
    profiles,
    statistics
  })
})
router.get('/system', ensureAuthenticated, async (req, res) => {
  const clientSettings = await SettingsClean.returnClientSettings()
  const serverSettings = await SettingsClean.returnSystemSettings()
  const printers = Runner.returnFarmPrinters()
  let user = null
  let group = null
  if (serverSettings.server.loginRequired === false) {
    user = 'No User'
    group = 'Administrator'
  } else {
    user = req.user.name
    group = req.user.group
  }
  res.render('system', {
    name: user,
    userGroup: group,
    version,
    printerCount: printers.length,
    page: 'System',
    helpers: prettyHelpers,
    clientSettings,
    serverSettings
  })
})
module.exports = router
