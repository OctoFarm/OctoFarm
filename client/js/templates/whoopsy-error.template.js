const cleanErrorResponseObject = (errors) => {
    let message = "";
    for (const [key] of Object.entries(errors)) {
        message += `${errors[key]?.message}`
    }
    return message;
}


export const getWhoopsyErrorTemplate = (message) => {
    const cleanMessage = cleanErrorResponseObject(JSON.parse(message))
    return `
        <div class="row">
            <div class="col-4 text-center">
                 <img width="90%" src="/images/toasty.jpg?<%= clientVersion %>"/>
            </div>
            <div class="col-8">
                <small>${cleanMessage}</small>    
            </div>
        </div>
    `
}
