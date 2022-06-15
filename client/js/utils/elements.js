import { getButtonLoaderTemplate } from "../templates/loaders.template";

export default class e {
    static get(element_id){
        return document.getElementById(element_id);
    }
    static exists(element) {
        return !!element;
    }
    static active(element) {
        if(this.exists(element)){
            return element.classList.contains("active")
        }
        return false;
    }
    static grabValueOrPlaceholder(element){
        if(this.exists(element)){
            return element.value.length > 0 ? element.value : element.placeholder;
        }
        return false;
    }
    static grabChecked(element){
        if(this.exists(element)){
            return element.checked;
        }
        return false;
    }
    static appendLoader(element){
        if(this.exists(element)){
            element.insertAdjacentHTML("afterbegin", getButtonLoaderTemplate());
        }
    }
    static removeLoader(element){
        if(this.exists(element)){
            element.innerHTML = element.innerHTML.replace(getButtonLoaderTemplate(), "");
        }
    }
    static doesElementNeedUpdating(element, value, meta){
        if(this.exists(element)){
            if (JSON.stringify(value) !== JSON.stringify(element[meta])) {
                element[meta] = value;
            }
        }
    }
}
