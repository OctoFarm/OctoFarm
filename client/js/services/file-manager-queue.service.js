import {
  getFileQueueRow,
  getFileRowID,
} from "../pages/file-manager/upload-queue.templates";

let FILE_QUEUE_TABLE_BODY;

export default class Queue {
  constructor() {
    FILE_QUEUE_TABLE_BODY = document.getElementById("uploadQueueTableBody");
    this.data = [];
  }
  add(record) {
    record.active = false;
    this.data.push(record);
    this.addToFileQueue(record);
  }
  deleteQueue() {
    this.data = [];
  }
  remove() {
    this.removeFromFileQueue(this.data[0]);
    this.data.shift();
  }
  first() {
    return this.data[0];
  }
  n(index) {
    return this.data[index];
  }
  activate(index) {
    this.data[index].active = true;
  }
  size() {
    return this.data.length;
  }
  all() {
    // REFACTOR bit weird, why not just pull this.data :/ ahh my learning exploits scripty kiddie copy pastey!
    const res = [];
    this.data.forEach((d, index) => {
      res.push(this.data[index]);
    });
    return res;
  }

  addToFileQueue(record) {
    let file = {
      printer: record.printerInfo.printerName,
      name: record.file.name,
      size: record.file.size,
      currentFolder: record.currentFolder,
    };
    file.index = getFileRowID(file);
    if (!!FILE_QUEUE_TABLE_BODY) {
      FILE_QUEUE_TABLE_BODY.insertAdjacentHTML(
        "beforeend",
        getFileQueueRow(file)
      );
    }
  }
  removeFromFileQueue(record) {
    const file = {
      printer: record.printerInfo.printerName,
      name: record.file.name,
    };
    setTimeout(() => {
      const queRow = document.getElementById(`queueRow-${getFileRowID(file)}`);
      if (!!queRow) {
        queRow.remove();
      }
    }, 3000);
  }
}
