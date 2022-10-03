const Queue = require("../services/fifo-queue.service");

let multiFileUploadQueueCache;

class MultiFileUploadQueueModule extends Queue {
    #defaultQueueItem = {
        file: null,
        printerList: [],
        uploaded: false
    }

    constructor (...items){
        super(...items)
    }

    start(){
        this.resume();

    }

    stop(){
        this.pause();
    }

    #validateTheNewQueueItem(item){
        if(!"file" in item){
            return "File Upload Queue | No file key provided!"
        }
        if(!"printerList" in item){
            return "File Upload Queue | No printer list provided!"
        }

        return true;
    }

    enqueue(item){
        const validated = this.#validateTheNewQueueItem(item)
        if(!validated){
            return validated;
        }
        this.add(item)
    }

    actionFile(){

    }

    get defaultQueueItem() {
        return Object.assign({}, this.#defaultQueueItem)
    }
}
// Inline caching of function. Utilised once throughout the server so passing out as a singleton.
if(!multiFileUploadQueueCache){
    multiFileUploadQueueCache = new MultiFileUploadQueueModule();
}

module.exports = multiFileUploadQueueCache;
