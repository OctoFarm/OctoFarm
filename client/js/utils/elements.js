export default class e {
    static get(element_id){
        return document.getElementById(element_id);
    }
    static exists(element) {
        return !!element;
    }
    static active(element) {
        if(this.exists){
            return element.classList.contains("active")
        }
        return false;
    }

}
