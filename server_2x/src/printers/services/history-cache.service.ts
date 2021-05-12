import {Injectable, NotImplementedException} from "@nestjs/common";
import {HistoryCache} from "./history.cache";
import {IHistoryCache} from "../interfaces/history-cache.interface";

@Injectable()
export class HistoryCacheService {
    constructor(
        private historyCache: HistoryCache
    ) {
    }

    getHistoryCache() {
        return this.historyCache;
    }

    async initHistoryCache() {
        if (!!this.historyCache) {
            await this.historyCache.initCache();
        } else {
            throw new Error("Cant init unconstructed historyCache.");
        }
    }
}
