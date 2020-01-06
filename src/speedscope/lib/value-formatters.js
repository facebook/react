import {zeroPad} from './utils';

export class RawValueFormatter {
    constructor() {
        this.unit = 'none';
    }
    format(v) {
        return v.toLocaleString();
    }
}
export class TimeFormatter {
    constructor(unit) {
        this.unit = unit;
        if (unit === 'nanoseconds')
            this.multiplier = 1e-9;
        else if (unit === 'microseconds')
            this.multiplier = 1e-6;
        else if (unit === 'milliseconds')
            this.multiplier = 1e-3;
        else
            this.multiplier = 1;
    }
    formatUnsigned(v) {
        const s = v * this.multiplier;
        if (s / 60 >= 1) {
            const minutes = Math.floor(s / 60);
            const seconds = Math.floor(s - minutes * 60).toString();
            return `${minutes}:${zeroPad(seconds, 2)}`;
        }
        if (s / 1 >= 1)
            return `${s.toFixed(2)}s`;
        if (s / 1e-3 >= 1)
            return `${(s / 1e-3).toFixed(2)}ms`;
        if (s / 1e-6 >= 1)
            return `${(s / 1e-6).toFixed(2)}µs`;
        else
            return `${(s / 1e-9).toFixed(2)}ns`;
    }
    format(v) {
        return `${v < 0 ? '-' : ''}${this.formatUnsigned(Math.abs(v))}`;
    }
}
export class ByteFormatter {
    constructor() {
        this.unit = 'bytes';
    }
    format(v) {
        if (v < 1024)
            return `${v.toFixed(0)} B`;
        v /= 1024;
        if (v < 1024)
            return `${v.toFixed(2)} KB`;
        v /= 1024;
        if (v < 1024)
            return `${v.toFixed(2)} MB`;
        v /= 1024;
        return `${v.toFixed(2)} GB`;
    }
}
