export default class OctoFarmclient {
  static get(item) {
    let url = `/${item}`;
    return fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  static delete(item) {
    let url = `/${item}`;
    return fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  static post(item, data) {
    let url = `/${item}`;
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
  }
}
