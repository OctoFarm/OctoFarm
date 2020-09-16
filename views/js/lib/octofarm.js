export default class OctoFarmclient {
    static get(item) {
        const url = `/${item}`;
        return fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
    }
    static delete(item) {
        const url = `/${item}`;
        return fetch(url, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            }
        });
    }
    static post(item, data) {
        const url = `/${item}`;
        return fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });
    }
}
