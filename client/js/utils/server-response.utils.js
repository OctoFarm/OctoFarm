import { createErrorToast, createSuccessToast } from "./toast";

export const handleServerResponse = (response, action) => {
    if(!!response?.errors && response.errors.length > 0){
        let errorMessage = "Error with your action: "

        errors.forEach(error => {
            errorMessage += `${error.toString()} <br>`
        })

        createErrorToast({message: errorMessage})

        return false;
    }

    console.log(response)

    if(!!response?.restartRequired){
        return true;
    }

    createSuccessToast({ message: action })
    return true;
}