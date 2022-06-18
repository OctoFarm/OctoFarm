import Noty from "noty";

const createToast = ({type, message = "No message provided", delay = 5000, closeWithClick = ["click"], layout = "bottomRight", buttons = []}) => {
    //This needs a more elegant solution, I think Noty is keeping the elements I remove with remove() from the DOM in memory somewhere...
    Noty.setMaxVisible(50);
    let alert = new Noty({
        type: type,
        theme: "bootstrap-v4",
        closeWith: closeWithClick,
        timeout: delay,
        layout,
        text: message,
        progressBar: true,
        buttons
    });
    alert.show();
    return alert;
}

const confirmToast = ({ message, delay, closeWithClick, buttons }) => {
    const layout = "center"
    return createToast({type: "warning", message, delay, closeWithClick, layout, buttons});
}

export const areYouSureConfirmToast = ({message, confirmFunction}) => {
    const buttons =[
        Noty.button("Cancel", "btn btn-outline-danger m-1 float-end", function () {
            Noty.closeAll();
        }),
        Noty.button("Confirm", "btn btn-outline-success m-1 float-end", async function () {
            Noty.closeAll();
            await confirmFunction();
        })
    ]
    return confirmToast({message, delay: false, buttons})
}

export const createInfoToast = ({ message, delay, closeWithClick }) => {
    return createToast({type: "info", message, delay, closeWithClick});
}

export const createWarningToast = ({ message, delay, closeWithClick }) => {
    return createToast({type: "warning", message, delay, closeWithClick});
}

export const createSuccessToast = ({ message, delay, closeWithClick }) => {
    return createToast({type: "success", message, delay, closeWithClick});
}

export const createErrorToast = ({ message, delay, closeWithClick }) => {
    return createToast({type: "error", message, delay, closeWithClick});
}