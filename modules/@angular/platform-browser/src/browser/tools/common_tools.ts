import {ApplicationRef, ComponentRef} from '@angular/core';

import {getDOM} from '../../dom/dom_adapter';
import {window} from '../../facade/browser';
import {NumberWrapper, isPresent} from '../../facade/lang';


export class ChangeDetectionPerfRecord {
  constructor(public msPerTick: number, public numTicks: number) {}
}

/**
 * Entry point for all Angular debug tools. This object corresponds to the `ng`
 * global variable accessible in the dev console.
 */
export class AngularTools {
  profiler: AngularProfiler;

  constructor(ref: ComponentRef<any>) { this.profiler = new AngularProfiler(ref); }
}

/**
 * Entry point for all Angular profiling-related debug tools. This object
 * corresponds to the `ng.profiler` in the dev console.
 */
export class AngularProfiler {
  appRef: ApplicationRef;

  constructor(ref: ComponentRef<any>) { this.appRef = ref.injector.get(ApplicationRef); }

  /**
   * Exercises change detection in a loop and then prints the average amount of
   * time in milliseconds how long a single round of change detection takes for
   * the current state of the UI. It runs a minimum of 5 rounds for a minimum
   * of 500 milliseconds.
   *
   * Optionally, a user may pass a `config` parameter containing a map of
   * options. Supported options are:
   *
   * `record` (boolean) - causes the profiler to record a CPU profile while
   * it exercises the change detector. Example:
   *
   * ```
   * ng.profiler.timeChangeDetection({record: true})
   * ```
   */
  timeChangeDetection(config: any): ChangeDetectionPerfRecord {
    var record = isPresent(config) && config['record'];
    var profileName = 'Change Detection';
    // Profiler is not available in Android browsers, nor in IE 9 without dev tools opened
    var isProfilerAvailable = isPresent(window.console.profile);
    if (record && isProfilerAvailable) {
      window.console.profile(profileName);
    }
    var start = getDOM().performanceNow();
    var numTicks = 0;
    while (numTicks < 5 || (getDOM().performanceNow() - start) < 500) {
      this.appRef.tick();
      numTicks++;
    }
    var end = getDOM().performanceNow();
    if (record && isProfilerAvailable) {
      // need to cast to <any> because type checker thinks there's no argument
      // while in fact there is:
      //
      // https://developer.mozilla.org/en-US/docs/Web/API/Console/profileEnd
      (<any>window.console.profileEnd)(profileName);
    }
    var msPerTick = (end - start) / numTicks;
    window.console.log(`ran ${numTicks} change detection cycles`);
    window.console.log(`${NumberWrapper.toFixed(msPerTick, 2)} ms per check`);

    return new ChangeDetectionPerfRecord(msPerTick, numTicks);
  }
}
