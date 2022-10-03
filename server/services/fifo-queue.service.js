class Queue {
    #elements = [];
    #paused = false;

    constructor(...elements) {
        // Initializing the queue with given arguments
        this.#elements = [...elements];
    }

    pause(){
        this.#paused = true;
    }

    resume(){
        this.#paused = false;
    }

    add(...args) {
        return this.#elements.push(...args);
    }

    remove() {
        if(this.#paused){
            return this.#elements;
        }
        return this.#elements.shift();
    }

    peek(){
        if(this.items){
            return this.#elements[0];
        }
        return [];
    }

    get items(){
        return this.#elements.length > 0 ? true : false
    }

    get paused(){
        return this.#paused;
    }

    get length() {
        return this.#elements.length;
    }

    get list(){
        return this.#elements;
    }
}

module.exports = Queue
