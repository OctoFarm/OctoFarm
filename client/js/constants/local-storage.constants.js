export const LOCAL_STORAGE_CONSTANTS = () => {
    return {
        FILE_UPLOAD_LIMIT: "file-upload-limit"
    }
}

export const LOCAL_STORAGE_LIST = () => {
    const LOCAL_STORAGE =  LOCAL_STORAGE_CONSTANTS();
    return Object.keys(LOCAL_STORAGE).map(function(key) {
        return LOCAL_STORAGE[key];
    });
}

