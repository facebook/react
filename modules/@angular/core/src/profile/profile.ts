import * as impl from './wtf_impl';

export {WtfScopeFn} from './wtf_impl';


// Change exports to const once https://github.com/angular/ts2dart/issues/150

/**
 * True if WTF is enabled.
 */
export var wtfEnabled = impl.detectWTF();

function noopScope(arg0?: any, arg1?: any): any {
  return null;
}

/**
 * Create trace scope.
 *
 * Scopes must be strictly nested and are analogous to stack frames, but
 * do not have to follow the stack frames. Instead it is recommended that they follow logical
 * nesting. You may want to use
 * [Event
 * Signatures](http://google.github.io/tracing-framework/instrumenting-code.html#custom-events)
 * as they are defined in WTF.
 *
 * Used to mark scope entry. The return value is used to leave the scope.
 *
 *     var myScope = wtfCreateScope('MyClass#myMethod(ascii someVal)');
 *
 *     someMethod() {
 *        var s = myScope('Foo'); // 'Foo' gets stored in tracing UI
 *        // DO SOME WORK HERE
 *        return wtfLeave(s, 123); // Return value 123
 *     }
 *
 * Note, adding try-finally block around the work to ensure that `wtfLeave` gets called can
 * negatively impact the performance of your application. For this reason we recommend that
 * you don't add them to ensure that `wtfLeave` gets called. In production `wtfLeave` is a noop and
 * so try-finally block has no value. When debugging perf issues, skipping `wtfLeave`, do to
 * exception, will produce incorrect trace, but presence of exception signifies logic error which
 * needs to be fixed before the app should be profiled. Add try-finally only when you expect that
 * an exception is expected during normal execution while profiling.
 *
 * @experimental
 */
export var wtfCreateScope: (signature: string, flags?: any) => impl.WtfScopeFn =
    wtfEnabled ? impl.createScope : (signature: string, flags?: any) => noopScope;

/**
 * Used to mark end of Scope.
 *
 * - `scope` to end.
 * - `returnValue` (optional) to be passed to the WTF.
 *
 * Returns the `returnValue for easy chaining.
 * @experimental
 */
export var wtfLeave: <T>(scope: any, returnValue?: T) => T =
    wtfEnabled ? impl.leave : (s: any, r?: any) => r;

/**
 * Used to mark Async start. Async are similar to scope but they don't have to be strictly nested.
 * The return value is used in the call to [endAsync]. Async ranges only work if WTF has been
 * enabled.
 *
 *     someMethod() {
 *        var s = wtfStartTimeRange('HTTP:GET', 'some.url');
 *        var future = new Future.delay(5).then((_) {
 *          wtfEndTimeRange(s);
 *        });
 *     }
 * @experimental
 */
export var wtfStartTimeRange: (rangeType: string, action: string) => any =
    wtfEnabled ? impl.startTimeRange : (rangeType: string, action: string) => null;

/**
 * Ends a async time range operation.
 * [range] is the return value from [wtfStartTimeRange] Async ranges only work if WTF has been
 * enabled.
 * @experimental
 */
export var wtfEndTimeRange: (range: any) => void =
    wtfEnabled ? impl.endTimeRange : (r: any) => null;
