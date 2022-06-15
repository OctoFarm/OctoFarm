const cleanErrorResponseObject = (errors) => {
    let message = "";
    for (const [key] of Object.entries(errors)) {
        message += `${errors[key]?.message}`
    }
    return message;
}


export const getWhoopsyErrorTemplate = (code, status, message) => {
    const cleanMessage = cleanErrorResponseObject(JSON.parse(message))
    return `
        <div class="hstack gap-2">
          <img width="45%" src="/images/toasty.jpg?<%= clientVersion %>"/>
          <div class="vstack gap-1">
              <b>(${status}) ${code.toLowerCase()}</b>
              <small>${cleanMessage}</small>     
           </div>

        </div>
     
    `
}