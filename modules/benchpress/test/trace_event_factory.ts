import {isPresent} from '@angular/facade';

export class TraceEventFactory {
  private _cat: string;
  private _pid;

  constructor(cat, pid) {
    this._cat = cat;
    this._pid = pid;
  }

  create(ph, name, time, args = null) {
    var res = {'name': name, 'cat': this._cat, 'ph': ph, 'ts': time, 'pid': this._pid};
    if (isPresent(args)) {
      res['args'] = args;
    }
    return res;
  }

  markStart(name, time) { return this.create('b', name, time); }

  markEnd(name, time) { return this.create('e', name, time); }

  start(name, time, args = null) { return this.create('B', name, time, args); }

  end(name, time, args = null) { return this.create('E', name, time, args); }

  instant(name, time, args = null) { return this.create('i', name, time, args); }

  complete(name, time, duration, args = null) {
    var res = this.create('X', name, time, args);
    res['dur'] = duration;
    return res;
  }
}
