import {parse} from "../../vendor/flatted.js";

async function asyncParse(str) {
    try {
        let info = parse(str)
        return info;
    } catch (e) {
        return false;
    }
}

let source = new EventSource("/sse/dashboardInfo/");

source.onmessage = async function(e) {
    if (e.data != null) {
        let res = await asyncParse(e.data)
        postMessage(res);
    }
};
source.onerror = function() {
        postMessage(false)
};
source.onclose = function() {
        postMessage(false)
};