/**
 * Stores error information; delivered via [NgZone.onError] stream.
 * @deprecated
 */
export class NgZoneError {
  constructor(public error: any, public stackTrace: any) {}
}


export class NgZoneImpl {
  static isInAngularZone(): boolean { return Zone.current.get('isAngularZone') === true; }

  /** @internal */
  private outer: Zone;
  /** @internal */
  private inner: Zone;

  private onEnter: () => void;
  private onLeave: () => void;
  private setMicrotask: (hasMicrotasks: boolean) => void;
  private setMacrotask: (hasMacrotasks: boolean) => void;
  private onError: (error: NgZoneError) => void;

  constructor({trace, onEnter, onLeave, setMicrotask, setMacrotask, onError}: {
    trace: boolean,
    onEnter: () => void,
    onLeave: () => void,
    setMicrotask: (hasMicrotasks: boolean) => void,
    setMacrotask: (hasMacrotasks: boolean) => void,
    onError: (error: NgZoneError) => void
  }) {
    this.onEnter = onEnter;
    this.onLeave = onLeave;
    this.setMicrotask = setMicrotask;
    this.setMacrotask = setMacrotask;
    this.onError = onError;

    if (Zone) {
      this.outer = this.inner = Zone.current;
      if ((Zone as any /** TODO #9100 */)['wtfZoneSpec']) {
        this.inner = this.inner.fork((Zone as any /** TODO #9100 */)['wtfZoneSpec']);
      }
      if (trace && (Zone as any /** TODO #9100 */)['longStackTraceZoneSpec']) {
        this.inner = this.inner.fork((Zone as any /** TODO #9100 */)['longStackTraceZoneSpec']);
      }
      this.inner = this.inner.fork({
        name: 'angular',
        properties: <any>{'isAngularZone': true},
        onInvokeTask: (delegate: ZoneDelegate, current: Zone, target: Zone, task: Task,
                       applyThis: any, applyArgs: any): any => {
          try {
            this.onEnter();
            return delegate.invokeTask(target, task, applyThis, applyArgs);
          } finally {
            this.onLeave();
          }
        },


        onInvoke: (delegate: ZoneDelegate, current: Zone, target: Zone, callback: Function,
                   applyThis: any, applyArgs: any[], source: string): any => {
          try {
            this.onEnter();
            return delegate.invoke(target, callback, applyThis, applyArgs, source);
          } finally {
            this.onLeave();
          }
        },

        onHasTask:
            (delegate: ZoneDelegate, current: Zone, target: Zone, hasTaskState: HasTaskState) => {
              delegate.hasTask(target, hasTaskState);
              if (current == target) {
                // We are only interested in hasTask events which originate from our zone
                // (A child hasTask event is not interesting to us)
                if (hasTaskState.change == 'microTask') {
                  this.setMicrotask(hasTaskState.microTask);
                } else if (hasTaskState.change == 'macroTask') {
                  this.setMacrotask(hasTaskState.macroTask);
                }
              }
            },

        onHandleError: (delegate: ZoneDelegate, current: Zone, target: Zone, error: any):
                           boolean => {
                             delegate.handleError(target, error);
                             this.onError(new NgZoneError(error, error.stack));
                             return false;
                           }
      });
    } else {
      throw new Error('Angular requires Zone.js polyfill.');
    }
  }

  runInner(fn: () => any): any { return this.inner.run(fn); };
  runInnerGuarded(fn: () => any): any { return this.inner.runGuarded(fn); };
  runOuter(fn: () => any): any { return this.outer.run(fn); };
}
