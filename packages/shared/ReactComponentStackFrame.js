/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {LazyComponent} from 'react/src/ReactLazy';

import {enableComponentStackLocations} from 'shared/ReactFeatureFlags';

import {
  REACT_SUSPENSE_TYPE,
  REACT_SUSPENSE_LIST_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_MEMO_TYPE,
  REACT_LAZY_TYPE,
} from 'shared/ReactSymbols';

import {disableLogs, reenableLogs} from 'shared/ConsolePatchingDev';

import ReactSharedInternals from 'shared/ReactSharedInternals';

let prefix;
let suffix;
export function describeBuiltInComponentFrame(name: string): string {
  if (enableComponentStackLocations) {
    if (prefix === undefined) {
      // Extract the VM specific prefix used by each line.
      try {
        throw Error();
      } catch (x) {
        const match = x.stack.trim().match(/\n( *(at )?)/);
        prefix = (match && match[1]) || '';
        suffix =
          x.stack.indexOf('\n    at') > -1
            ? // V8
              ' (<anonymous>)'
            : // JSC/Spidermonkey
              x.stack.indexOf('@') > -1
              ? '@unknown:0:0'
              : // Other
                '';
      }
    }
    // We use the prefix to ensure our stacks line up with native stack frames.
    return '\n' + prefix + name + suffix;
  } else {
    return describeComponentFrame(name);
  }
}

export function describeDebugInfoFrame(name: string, env: ?string): string {
  return describeBuiltInComponentFrame(name + (env ? ' [' + env + ']' : ''));
}

let reentry = false;
let componentFrameCache;
if (__DEV__) {
  const PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
  componentFrameCache = new PossiblyWeakMap<Function, string>();
}

/**
 * Leverages native browser/VM stack frames to get proper details (e.g.
 * filename, line + col number) for a single component in a component stack. We
 * do this by:
 *   (1) throwing and catching an error in the function - this will be our
 *       control error.
 *   (2) calling the component which will eventually throw an error that we'll
 *       catch - this will be our sample error.
 *   (3) diffing the control and sample error stacks to find the stack frame
 *       which represents our component.
 */
export function describeNativeComponentFrame(
  fn: Function,
  construct: boolean,
): string {
  // If something asked for a stack inside a fake render, it should get ignored.
  if (!fn || reentry) {
    return '';
  }

  if (__DEV__) {
    const frame = componentFrameCache.get(fn);
    if (frame !== undefined) {
      return frame;
    }
  }

  reentry = true;
  const previousPrepareStackTrace = Error.prepareStackTrace;
  // $FlowFixMe[incompatible-type] It does accept undefined.
  Error.prepareStackTrace = undefined;
  let previousDispatcher = null;

  if (__DEV__) {
    previousDispatcher = ReactSharedInternals.H;
    // Set the dispatcher in DEV because this might be call in the render function
    // for warnings.
    ReactSharedInternals.H = null;
    disableLogs();
  }

  /**
   * Finding a common stack frame between sample and control errors can be
   * tricky given the different types and levels of stack trace truncation from
   * different JS VMs. So instead we'll attempt to control what that common
   * frame should be through this object method:
   * Having both the sample and control errors be in the function under the
   * `DescribeNativeComponentFrameRoot` property, + setting the `name` and
   * `displayName` properties of the function ensures that a stack
   * frame exists that has the method name `DescribeNativeComponentFrameRoot` in
   * it for both control and sample stacks.
   */
  const RunInRootFrame = {
    DetermineComponentFrameRoot(): [?string, ?string] {
      let control;
      try {
        // This should throw.
        if (construct) {
          // Something should be setting the props in the constructor.
          const Fake = function () {
            throw Error();
          };
          // $FlowFixMe[prop-missing]
          Object.defineProperty(Fake.prototype, 'props', {
            set: function () {
              // We use a throwing setter instead of frozen or non-writable props
              // because that won't throw in a non-strict mode function.
              throw Error();
            },
          });
          if (typeof Reflect === 'object' && Reflect.construct) {
            // We construct a different control for this case to include any extra
            // frames added by the construct call.
            try {
              Reflect.construct(Fake, []);
            } catch (x) {
              control = x;
            }
            Reflect.construct(fn, [], Fake);
          } else {
            try {
              Fake.call();
            } catch (x) {
              control = x;
            }
            // $FlowFixMe[prop-missing] found when upgrading Flow
            fn.call(Fake.prototype);
          }
        } else {
          try {
            throw Error();
          } catch (x) {
            control = x;
          }
          // TODO(luna): This will currently only throw if the function component
          // tries to access React/ReactDOM/props. We should probably make this throw
          // in simple components too
          const maybePromise = fn();

          // If the function component returns a promise, it's likely an async
          // component, which we don't yet support. Attach a noop catch handler to
          // silence the error.
          // TODO: Implement component stacks for async client components?
          if (maybePromise && typeof maybePromise.catch === 'function') {
            maybePromise.catch(() => {});
          }
        }
      } catch (sample) {
        // This is inlined manually because closure doesn't do it for us.
        if (sample && control && typeof sample.stack === 'string') {
          return [sample.stack, control.stack];
        }
      }
      return [null, null];
    },
  };
  // $FlowFixMe[prop-missing]
  RunInRootFrame.DetermineComponentFrameRoot.displayName =
    'DetermineComponentFrameRoot';
  const namePropDescriptor = Object.getOwnPropertyDescriptor(
    RunInRootFrame.DetermineComponentFrameRoot,
    'name',
  );
  // Before ES6, the `name` property was not configurable.
  if (namePropDescriptor && namePropDescriptor.configurable) {
    // V8 utilizes a function's `name` property when generating a stack trace.
    Object.defineProperty(
      RunInRootFrame.DetermineComponentFrameRoot,
      // Configurable properties can be updated even if its writable descriptor
      // is set to `false`.
      // $FlowFixMe[cannot-write]
      'name',
      {value: 'DetermineComponentFrameRoot'},
    );
  }

  try {
    const [sampleStack, controlStack] =
      RunInRootFrame.DetermineComponentFrameRoot();
    if (sampleStack && controlStack) {
      // This extracts the first frame from the sample that isn't also in the control.
      // Skipping one frame that we assume is the frame that calls the two.
      const sampleLines = sampleStack.split('\n');
      const controlLines = controlStack.split('\n');
      let s = 0;
      let c = 0;
      while (
        s < sampleLines.length &&
        !sampleLines[s].includes('DetermineComponentFrameRoot')
      ) {
        s++;
      }
      while (
        c < controlLines.length &&
        !controlLines[c].includes('DetermineComponentFrameRoot')
      ) {
        c++;
      }
      // We couldn't find our intentionally injected common root frame, attempt
      // to find another common root frame by search from the bottom of the
      // control stack...
      if (s === sampleLines.length || c === controlLines.length) {
        s = sampleLines.length - 1;
        c = controlLines.length - 1;
        while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
          // We expect at least one stack frame to be shared.
          // Typically this will be the root most one. However, stack frames may be
          // cut off due to maximum stack limits. In this case, one maybe cut off
          // earlier than the other. We assume that the sample is longer or the same
          // and there for cut off earlier. So we should find the root most frame in
          // the sample somewhere in the control.
          c--;
        }
      }
      for (; s >= 1 && c >= 0; s--, c--) {
        // Next we find the first one that isn't the same which should be the
        // frame that called our sample function and the control.
        if (sampleLines[s] !== controlLines[c]) {
          // In V8, the first line is describing the message but other VMs don't.
          // If we're about to return the first line, and the control is also on the same
          // line, that's a pretty good indicator that our sample threw at same line as
          // the control. I.e. before we entered the sample frame. So we ignore this result.
          // This can happen if you passed a class to function component, or non-function.
          if (s !== 1 || c !== 1) {
            do {
              s--;
              c--;
              // We may still have similar intermediate frames from the construct call.
              // The next one that isn't the same should be our match though.
              if (c < 0 || sampleLines[s] !== controlLines[c]) {
                // V8 adds a "new" prefix for native classes. Let's remove it to make it prettier.
                let frame = '\n' + sampleLines[s].replace(' at new ', ' at ');

                // If our component frame is labeled "<anonymous>"
                // but we have a user-provided "displayName"
                // splice it in to make the stack more readable.
                if (fn.displayName && frame.includes('<anonymous>')) {
                  frame = frame.replace('<anonymous>', fn.displayName);
                }

                if (__DEV__) {
                  if (typeof fn === 'function') {
                    componentFrameCache.set(fn, frame);
                  }
                }
                // Return the line we found.
                return frame;
              }
            } while (s >= 1 && c >= 0);
          }
          break;
        }
      }
    }
  } finally {
    reentry = false;
    if (__DEV__) {
      ReactSharedInternals.H = previousDispatcher;
      reenableLogs();
    }
    Error.prepareStackTrace = previousPrepareStackTrace;
  }
  // Fallback to just using the name if we couldn't make it throw.
  const name = fn ? fn.displayName || fn.name : '';
  const syntheticFrame = name ? describeBuiltInComponentFrame(name) : '';
  if (__DEV__) {
    if (typeof fn === 'function') {
      componentFrameCache.set(fn, syntheticFrame);
    }
  }
  return syntheticFrame;
}

function describeComponentFrame(name: null | string) {
  return '\n    in ' + (name || 'Unknown');
}

export function describeClassComponentFrame(ctor: Function): string {
  if (enableComponentStackLocations) {
    return describeNativeComponentFrame(ctor, true);
  } else {
    return describeFunctionComponentFrame(ctor);
  }
}

export function describeFunctionComponentFrame(fn: Function): string {
  if (enableComponentStackLocations) {
    return describeNativeComponentFrame(fn, false);
  } else {
    if (!fn) {
      return '';
    }
    const name = fn.displayName || fn.name || null;
    return describeComponentFrame(name);
  }
}

function shouldConstruct(Component: Function) {
  const prototype = Component.prototype;
  return !!(prototype && prototype.isReactComponent);
}

// TODO: Delete this once the key warning no longer uses it. I.e. when enableOwnerStacks ship.
export function describeUnknownElementTypeFrameInDEV(type: any): string {
  if (!__DEV__) {
    return '';
  }
  if (type == null) {
    return '';
  }
  if (typeof type === 'function') {
    if (enableComponentStackLocations) {
      return describeNativeComponentFrame(type, shouldConstruct(type));
    } else {
      return describeFunctionComponentFrame(type);
    }
  }
  if (typeof type === 'string') {
    return describeBuiltInComponentFrame(type);
  }
  switch (type) {
    case REACT_SUSPENSE_TYPE:
      return describeBuiltInComponentFrame('Suspense');
    case REACT_SUSPENSE_LIST_TYPE:
      return describeBuiltInComponentFrame('SuspenseList');
  }
  if (typeof type === 'object') {
    switch (type.$$typeof) {
      case REACT_FORWARD_REF_TYPE:
        return describeFunctionComponentFrame(type.render);
      case REACT_MEMO_TYPE:
        // Memo may contain any component type so we recursively resolve it.
        return describeUnknownElementTypeFrameInDEV(type.type);
      case REACT_LAZY_TYPE: {
        const lazyComponent: LazyComponent<any, any> = (type: any);
        const payload = lazyComponent._payload;
        const init = lazyComponent._init;
        try {
          // Lazy may contain any component type so we recursively resolve it.
          return describeUnknownElementTypeFrameInDEV(init(payload));
        } catch (x) {}
      }
    }
  }
  return '';
}
