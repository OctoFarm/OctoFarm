
const fs = require('fs')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const Logger = require('../lib/logger.js')
const logger = new Logger('OctoFarm-Scripts')
const wol = require('wakeonlan')

class SystemCommands {
  static async rebootOctoFarm () {
    logger.info('Restart OctoFarm server requests')
    try {
      const { stdout, stderr } = await exec('pm2 restart OctoFarm')
      logger.info('stdout:', stdout)
      logger.info('stderr:', stderr)
    } catch (err) {
      logger.error(err)
    }
  }
}

class Script {
  static async fire (scriptLocation, message) {
    logger.info('Script: ', scriptLocation)
    logger.info('Message: ', message)
    try {
      const { stdout, stderr } = await exec(`${scriptLocation} ${message}`)
      logger.info('stdout:', stdout)
      logger.info('stderr:', stderr)
      return scriptLocation + ': ' + stdout
    } catch (err) {
      logger.error(err)
      return err
    }
  }

  static async wol (wolSettings) {
    const opts = {
      address: wolSettings.ip,
      count: wolSettings.count,
      interval: wolSettings.interval,
      port: wolSettings.port
    }
    wol(wolSettings.MAC).then(() => {
      logger.info('Wake on LAN Packet successfully fired...')
    })
  }
}

// Grab Logs
class Logs {
  static async grabLogs () {
    const fileArray = []
    const testFolder = './logs/'
    const folderContents = await fs.readdirSync(testFolder)
    for (let i = 0; i < folderContents.length; i++) {
      const stats = await fs.statSync(testFolder + folderContents[i])
      const logFile = {}
      logFile.name = folderContents[i]
      logFile.size = stats.size
      logFile.modified = stats.mtime
      logFile.created = stats.birthtime
      fileArray.push(logFile)
    }
    return fileArray
  }
}

module.exports = { Logs, SystemCommands, Script }
