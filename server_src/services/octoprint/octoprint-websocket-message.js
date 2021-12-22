class OctoprintWebsocketMessage {
  parseData(data) {
    return JSON.parse(data.toString());
  }

  static handleMessage(data) {
    console.log(this.parseData(data));
  }
}

module.exports = OctoprintWebsocketMessage;
