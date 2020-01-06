/* tslint:disable:variable-name */
/* tslint:disable:no-console */
/* tslint:disable:no-bitwise */
import binsearch from 'array-binsearch';
import Bounds from './bounds';
import Process from './process';
import CpuProfile from './cpu-profile';
import { isRenderEnd, isRenderStart } from './render-events';
import { PROCESS_NAME, TRACE_EVENT_PHASE_BEGIN, TRACE_EVENT_PHASE_COMPLETE, TRACE_EVENT_PHASE_END, TRACE_EVENT_PHASE_METADATA, TRACE_EVENT_PHASE_SAMPLE, TRACE_EVENT_PHASE_INSTANT, } from './trace_event';
import traceEventComparator from './trace_event_comparator';
export default class Trace {
    constructor() {
        this.processes = [];
        this.bounds = new Bounds();
        this.events = [];
        this.browserProcess = null;
        this.gpuProcess = null;
        this.rendererProcesses = [];
        this.parents = new Map();
        this.stack = [];
        this.profileMap = new Map();
    }
    cpuProfile(min, max) {
        const { _cpuProfile } = this;
        if (_cpuProfile === undefined) {
            console.trace('public cpuProfile');
            throw new Error('trace is missing CpuProfile');
        }
        return new CpuProfile(_cpuProfile, this.events, min, max);
    }
    process(pid) {
        let process = this.findProcess(pid);
        if (process === undefined) {
            process = new Process(pid);
            this.processes.push(process);
        }
        return process;
    }
    thread(pid, tid) {
        return this.process(pid).thread(tid);
    }
    addEvents(events) {
        for (const event of events) {
            this.addEvent(event);
        }
    }
    cpuProfileBuildModel(event) {
        if (event.ph === TRACE_EVENT_PHASE_INSTANT &&
            event.cat === 'disabled-by-default-devtools.timeline') {
            if (event.name === 'CpuProfile') {
                this._cpuProfile = event.args.data.cpuProfile;
            }
            else if (event.name === 'TracingStartedInPage') {
                this.lastTracingStartedInPageEvent = event;
            }
        }
        else if (event.ph === TRACE_EVENT_PHASE_SAMPLE) {
            if (event.name === 'Profile') {
                const profile = event;
                this.profileMap.set(profile.id, {
                    pid: profile.pid,
                    tid: profile.tid,
                    cpuProfile: {
                        startTime: profile.args.data.startTime,
                        endTime: 0,
                        duration: 0,
                        nodes: [],
                        samples: [],
                        timeDeltas: [],
                    },
                });
            }
            else if (event.name === 'ProfileChunk') {
                const profileChunk = event;
                const profileEntry = this.profileMap.get(profileChunk.id);
                if (profileChunk.args.data.cpuProfile.nodes) {
                    profileChunk.args.data.cpuProfile.nodes.forEach((node) => {
                        profileEntry.cpuProfile.nodes.push(Object.assign(node, {
                            sampleCount: 0,
                            min: 0,
                            max: 0,
                            total: 0,
                            self: 0,
                        }));
                    });
                }
                profileEntry.cpuProfile.samples.push(...profileChunk.args.data.cpuProfile.samples);
                profileEntry.cpuProfile.timeDeltas.push(...profileChunk.args.data.timeDeltas);
            }
        }
        // determine main process
        if (this.lastTracingStartedInPageEvent) {
            // if this was recorded with the Performance tab, this should be the main process
            this.mainProcess = this.process(this.lastTracingStartedInPageEvent.pid);
        }
        else {
            // fallback to Renderer process with most events
            this.mainProcess = this.processes
                .filter(p => p.name === PROCESS_NAME.RENDERER)
                .reduce((a, b) => (b.events.length > a.events.length ? b : a));
        }
        for (const profileEntry of this.profileMap.values()) {
            if (profileEntry.pid === this.mainProcess.id &&
                profileEntry.tid === this.mainProcess.mainThread.id) {
                this._cpuProfile = profileEntry.cpuProfile;
                const { nodes } = profileEntry.cpuProfile;
                const nodeMap = new Map();
                nodes.forEach(node => nodeMap.set(node.id, node));
                nodes.forEach(node => {
                    if (node.parent !== undefined) {
                        const parent = nodeMap.get(node.parent);
                        if (!parent) {
                            return; // TODO Brian added this
                        }
                        if (parent.children) {
                            parent.children.push(node.id);
                        }
                        else {
                            parent.children = [node.id];
                        }
                    }
                });
                break;
            }
        }
    }
    buildModel() {
        const { events } = this;
        if (this.stack.length > 0) {
            this.stack.length = 0;
        }
        for (const event of events) {
            this.associateParent(event);
            const process = this.process(event.pid);
            process.addEvent(event);
            this.cpuProfileBuildModel(event);
        }
    }
    getParent(event) {
        this.parents.get(event);
    }
    associateParent(event) {
        if (event.ph !== TRACE_EVENT_PHASE_COMPLETE) {
            return;
        }
        const { stack, parents } = this;
        const { ts, pid, tid } = event;
        
        if (stack.length > 0) { // TODO Brian added this
        for (let i = stack.length - 1; i >= 0; i--) {
            const parent = stack[i];
            if (ts < parent.ts + parent.dur) {
                if (parent.pid === pid && parent.tid === tid) {
                    parents.set(event, parent);
                    break;
                }
            }
            else {
                stack.splice(i, 1);
            }
        }
        } // TODO Brian added this
        stack.push(event);
    }
    addEvent(event) {
        if (event.ph === TRACE_EVENT_PHASE_END || isRenderEnd(event)) {
            this.endEvent(event);
            return;
        }
        const events = this.events;
        let index = binsearch(events, event, traceEventComparator);
        if (index < 0) {
            index = ~index;
        }
        else {
            // insert just after if ts order matched
            index++;
        }
        events.splice(index, 0, event);
        if (event.ph === TRACE_EVENT_PHASE_METADATA) {
            this.addMetadata(event);
            return;
        }
        if (event.ph === TRACE_EVENT_PHASE_BEGIN || isRenderStart(event)) {
            this.stack.push(event);
        }
        this.bounds.addEvent(event);
    }
    findProcess(pid) {
        for (const process of this.processes) {
            if (process.id === pid) {
                return process;
            }
        }
        return;
    }
    endEvent(end) {
        const { stack } = this;
        for (let i = stack.length - 1; i >= 0; i--) {
            const begin = stack[i];
            if (begin.name === end.name &&
                begin.cat === end.cat &&
                begin.tid === end.tid &&
                begin.pid === end.pid) {
                stack.splice(i, 1);
                return this.completeEvent(begin, end);
            }
        }
        throw new Error('could not find matching B phase for E phase event');
    }
    completeEvent(begin, end) {
        let args = '__stripped__';
        if (typeof begin.args === 'object' && begin.args !== null) {
            args = Object.assign({}, begin.args);
        }
        if (typeof end.args === 'object' && end.args !== null) {
            args = Object.assign(args === undefined ? {} : args, end.args);
        }
        const complete = {
            args,
            cat: begin.cat,
            dur: end.ts - begin.ts,
            name: begin.name,
            ph: TRACE_EVENT_PHASE_COMPLETE,
            pid: begin.pid,
            tdur: end.tts - begin.tts,
            tid: begin.tid,
            ts: begin.ts,
            tts: begin.tts,
        };
        const { events } = this;
        const index = binsearch(events, begin, traceEventComparator);
        events[index] = complete;
    }
    addMetadata(event) {
        const { pid, tid } = event;
        if (event.args === '__stripped__') {
            return;
        }
        switch (event.name) {
            case 'num_cpus':
                this.numberOfProcessors = event.args.number;
                break;
            case 'process_name':
                const processName = event.args.name;
                const process = this.process(pid);
                process.name = processName;
                if (processName === 'GPU Process') {
                    this.gpuProcess = process;
                }
                else if (processName === 'Browser') {
                    this.browserProcess = process;
                }
                else if (processName === 'Renderer') {
                    this.rendererProcesses.push(process);
                }
                break;
            case 'process_labels':
                this.process(pid).labels = event.args.labels;
                break;
            case 'process_sort_index':
                this.process(pid).sortIndex = event.args.sort_index;
                break;
            case 'trace_buffer_overflowed':
                this.process(pid).traceBufferOverflowedAt = event.args.overflowed_at_ts;
                break;
            case 'thread_name':
                const threadName = event.args.name;
                const thread = this.thread(pid, tid);
                thread.name = threadName;
                if (threadName === 'CrRendererMain') {
                    this.process(pid).mainThread = thread;
                }
                else if (threadName === 'ScriptStreamerThread') {
                    this.process(pid).scriptStreamerThread = thread;
                }
                break;
            case 'thread_sort_index':
                this.thread(pid, tid).sortIndex = event.args.sort_index;
                break;
            case 'IsTimeTicksHighResolution':
                this.process(pid).isTimeTicksHighResolution = event.args.value;
                break;
            case 'TraceConfig':
                this.process(pid).traceConfig = event.args.value;
                break;
            default:
                // console.warn("unrecognized metadata:", JSON.stringify(event, null, 2));
                break;
        }
    }
}
