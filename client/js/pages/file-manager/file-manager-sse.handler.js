
export const eventsURL = "/events";

export async function eventsSSEHandler(data) {
    if (!!data) {
        const { type, id, message } = data;
        if(type === "file_update"){
            const element = Object.keys(message)[0];
            console.log("FILE", id)
            console.log("MESSAGE", message);
            document.getElementById("")
        }
    }
}
