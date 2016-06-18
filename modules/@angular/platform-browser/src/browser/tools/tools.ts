import {ComponentRef} from '@angular/core';
import {global} from '../../facade/lang';

import {AngularTools} from './common_tools';

var context = <any>global;

/**
 * Enabled Angular 2 debug tools that are accessible via your browser's
 * developer console.
 *
 * Usage:
 *
 * 1. Open developer console (e.g. in Chrome Ctrl + Shift + j)
 * 1. Type `ng.` (usually the console will show auto-complete suggestion)
 * 1. Try the change detection profiler `ng.profiler.timeChangeDetection()`
 *    then hit Enter.
 */
export function enableDebugTools<T>(ref: ComponentRef<T>): ComponentRef<T> {
  context.ng = new AngularTools(ref);
  return ref;
}

/**
 * Disables Angular 2 tools.
 */
export function disableDebugTools(): void {
  delete context.ng;
}
