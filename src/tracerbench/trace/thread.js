import Bounds from './bounds';
export default class Thread {
    constructor(id) {
        this.bounds = new Bounds();
        this.events = [];
        this.id = id;
    }
    addEvent(event) {
        this.bounds.addEvent(event);
        this.events.push(event);
    }
}
