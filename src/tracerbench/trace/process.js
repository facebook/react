import Bounds from './bounds';
import Thread from './thread';
export default class Process {
    constructor(id) {
        this.id = id;
        this.threads = [];
        this.mainThread = null;
        this.scriptStreamerThread = null;
        this.bounds = new Bounds();
        this.events = [];
        this.threadMap = {};
    }
    thread(tid) {
        let thread = this.threadMap[tid];
        if (thread === undefined) {
            this.threadMap[tid] = thread = new Thread(tid);
            this.threads.push(thread);
        }
        return thread;
    }
    addEvent(event) {
        this.bounds.addEvent(event);
        this.events.push(event);
        this.thread(event.tid).addEvent(event);
    }
}
