import { TRACE_EVENT_PHASE_COMPLETE, TRACE_EVENT_PHASE_METADATA } from './trace_event';
export default class Bounds {
    constructor() {
        this.min = 0;
        this.max = 0;
        this.empty = true;
    }
    addValue(value) {
        if (this.empty) {
            this.empty = false;
            this.min = this.max = value;
        }
        else {
            this.max = Math.max(this.max, value);
            this.min = Math.min(this.min, value);
        }
    }
    addEvent(event) {
        if (event.ph === TRACE_EVENT_PHASE_METADATA) {
            return;
        }
        this.addValue(event.ts);
        if (event.ph === TRACE_EVENT_PHASE_COMPLETE) {
            this.addValue(event.ts + event.dur);
        }
    }
}
