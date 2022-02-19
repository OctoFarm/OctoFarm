import {MESSAGE_TYPES} from "../../../../server/constants/sse.constants";

export const eventsURL = "/events";

export async function eventsSSEHandler(data) {
    if (!!data) {
        const { type, id, message } = data;
        if(type === MESSAGE_TYPES.FILE_UPDATE){
            const elementToUpdate = document.getElementById(`${message.key}-${id}`);
            if(!elementToUpdate){
                return;
            }
            elementToUpdate.innerHTML = message.value;
        }
    }
}
