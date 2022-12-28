const fetch = require("node-fetch");
const { getAirgappedSettingIfAvailable } = require("../../app-env");
const Logger = require("../../handlers/logger");
const { LOGGER_ROUTE_KEYS } = require("../../constants/logger.constants");

const logger = new Logger(LOGGER_ROUTE_KEYS.MODULE_ONLINE_CHECKER);

let onlineCheckerServiceCache;

class OnlineCheckerService {
    #air_gapped;
    #check_url = "http://NeverSSL.com"

    constructor(force_air_gap = false){
        if(force_air_gap){
            logger.warning("Detected .env key to force application offline! Setting application run mode to air_gapped")
            this.#air_gapped = true;
        }
    }

    async check() {
        const connectivityCheck = await fetch(this.#check_url)
        logger.info("Checked internet connectivity state", { air_gapped: !connectivityCheck.ok } )
        this.#air_gapped = !connectivityCheck?.ok
    }

    get airGapped(){
        return this.#air_gapped;
    }
}

if(!onlineCheckerServiceCache){
    onlineCheckerServiceCache = new OnlineCheckerService(getAirgappedSettingIfAvailable());
}

module.exports = onlineCheckerServiceCache
