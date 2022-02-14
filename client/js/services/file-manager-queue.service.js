import {getFileQueueRow, getFileRowID} from "../pages/file-manager/upload-queue.templates"

const FILE_QUEUE_TABLE_BODY = document.getElementById("uploadQueueTableBody");

export default class Queue {
  constructor() {
    this.data = [];
  }
  add(record) {
    record.active = false;
    this.data.push(record);
    this.addToFileQueue(record)
  }
  deleteQueue(){
    this.data = [];
  }
  remove() {
    this.removeFromFileQueue(this.data[0])
    this.data.shift();
  }
  first() {
    return this.data[0];
  }
  n(index){
    return this.data[index];
  }
  activate(index) {
    this.data[index].active = true;
  }
  size() {
    return this.data.length;
  }
  all() {
    // REFACTOR bit weird, why not just pull this.data :/
    const res = [];
    this.data.forEach((d, index) => {
      res.push(this.data[index]);
    });
    return res;
  }

  addToFileQueue(record){
    let file = {
      printer: record.printerInfo.printerName,
      name: record.file.name,
      size: record.file.size,
      currentFolder: record.currentFolder,
    }
    file.index = getFileRowID(file)
    FILE_QUEUE_TABLE_BODY.insertAdjacentHTML("beforeend", getFileQueueRow(file))
  }
  removeFromFileQueue(record){
    const file = {
      printer: record.printerInfo.printerName,
      name: record.file.name,
    }
    setTimeout(() => {
      document.getElementById(`queueRow-${getFileRowID(file)}`).remove();
    }, 3000)

  }
}
