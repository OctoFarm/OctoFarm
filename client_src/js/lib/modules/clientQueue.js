export default class Queue {
  constructor() {
    this.data = [];
  }
  add(record) {
    record.active = false;
    this.data.push(record);
  }
  remove() {
    this.data.shift();
  }
  first() {
    return this.data[0];
  }
  activate(index) {
    this.data[index].active = true;
  }
  size() {
    return this.data.length;
  }
  all() {
    let res = [];
    this.data.forEach((d, index) => {
      res.push(this.data[index]);
    });
    return res;
  }
}
