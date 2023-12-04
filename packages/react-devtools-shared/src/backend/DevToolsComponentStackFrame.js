/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// This is a DevTools fork of ReactComponentStackFrame.
// This fork enables DevTools to use the same "native" component stack format,
// while still maintaining support for multiple renderer versions
// (which use different values for ReactTypeOfWork).

import type {LazyComponent} from 'react/src/ReactLazy';
import type {CurrentDispatcherRef} from './types';

import {
  FORWARD_REF_NUMBER,
  FORWARD_REF_SYMBOL_STRING,
  LAZY_NUMBER,
  LAZY_SYMBOL_STRING,
  MEMO_NUMBER,
  MEMO_SYMBOL_STRING,
  SUSPENSE_NUMBER,
  SUSPENSE_SYMBOL_STRING,
  SUSPENSE_LIST_NUMBER,
  SUSPENSE_LIST_SYMBOL_STRING,
} from './ReactSymbols';

// The shared console patching code is DEV-only.
// We can't use it since DevTools only ships production builds.
import {disableLogs, reenableLogs} from './DevToolsConsolePatching';

let prefix;
export function describeBuiltInComponentFrame(
  name: string,
  ownerFn: void | null | Function,
): string {
  if (prefix === undefined) {
    // Extract the VM specific prefix used by each line.
    try {
      throw Error();
    } catch (x) {
      const match = x.stack.trim().match(/\n( *(at )?)/);
      prefix = (match && match[1]) || '';
    }
  }
  // We use the prefix to ensure our stacks line up with native stack frames.
  return '\n' + prefix + name;
}

let reentry = false;
let componentFrameCache;
if (__DEV__) {
  const PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
  componentFrameCache = new PossiblyWeakMap<$FlowFixMe, string>();
}

export function describeNativeComponentFrame(
  fn: Function,
  construct: boolean,
  currentDispatcherRef: CurrentDispatcherRef,
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

  let control;

  const previousPrepareStackTrace = Error.prepareStackTrace;
  // $FlowFixMe[incompatible-type] It does accept undefined.
  Error.prepareStackTrace = undefined;

  reentry = true;

  // Override the dispatcher so effects scheduled by this shallow render are thrown away.
  //
  // Note that unlike the code this was forked from (in ReactComponentStackFrame)
  // DevTools should override the dispatcher even when DevTools is compiled in production mode,
  // because the app itself may be in development mode and log errors/warnings.
  const previousDispatcher = currentDispatcherRef.current;
  currentDispatcherRef.current = null;
  disableLogs();

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
      fn();
    }
  } catch (sample) {
    // This is inlined manually because closure doesn't do it for us.
    if (sample && control && typeof sample.stack === 'string') {
      // This extracts the first frame from the sample that isn't also in the control.
      // Skipping one frame that we assume is the frame that calls the two.
      const sampleLines = sample.stack.split('\n');
      const controlLines = control.stack.split('\n');
      let s = sampleLines.length - 1;
      let c = controlLines.length - 1;
      while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
        // We expect at least one stack frame to be shared.
        // Typically this will be the root most one. However, stack frames may be
        // cut off due to maximum stack limits. In this case, one maybe cut off
        // earlier than the other. We assume that the sample is longer or the same
        // and there for cut off earlier. So we should find the root most frame in
        // the sample somewhere in the control.
        c--;
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
                const frame = '\n' + sampleLines[s].replace(' at new ', ' at ');
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

    Error.prepareStackTrace = previousPrepareStackTrace;

    currentDispatcherRef.current = previousDispatcher;
    reenableLogs();
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

export function describeClassComponentFrame(
  ctor: Function,
  ownerFn: void | null | Function,
  currentDispatcherRef: CurrentDispatcherRef,
): string {
  return describeNativeComponentFrame(ctor, true, currentDispatcherRef);
}

export function describeFunctionComponentFrame(
  fn: Function,
  ownerFn: void | null | Function,
  currentDispatcherRef: CurrentDispatcherRef,
): string {
  return describeNativeComponentFrame(fn, false, currentDispatcherRef);
}

function shouldConstruct(Component: Function) {
  const prototype = Component.prototype;
  return !!(prototype && prototype.isReactComponent);
}

export function describeUnknownElementTypeFrameInDEV(
  type: any,
  ownerFn: void | null | Function,
  currentDispatcherRef: CurrentDispatcherRef,
): string {
  if (!__DEV__) {
    return '';
  }
  if (type == null) {
    return '';
  }
  if (typeof type === 'function') {
    return describeNativeComponentFrame(
      type,
      shouldConstruct(type),
      currentDispatcherRef,
    );
  }
  if (typeof type === 'string') {
    return describeBuiltInComponentFrame(type, ownerFn);
  }
  switch (type) {
    case SUSPENSE_NUMBER:
    case SUSPENSE_SYMBOL_STRING:
      return describeBuiltInComponentFrame('Suspense', ownerFn);
    case SUSPENSE_LIST_NUMBER:
    case SUSPENSE_LIST_SYMBOL_STRING:
      return describeBuiltInComponentFrame('SuspenseList', ownerFn);
  }
  if (typeof type === 'object') {
    switch (type.$$typeof) {
      case FORWARD_REF_NUMBER:
      case FORWARD_REF_SYMBOL_STRING:
        return describeFunctionComponentFrame(
          type.render,
          ownerFn,
          currentDispatcherRef,
        );
      case MEMO_NUMBER:
      case MEMO_SYMBOL_STRING:
        // Memo may contain any component type so we recursively resolve it.
        return describeUnknownElementTypeFrameInDEV(
          type.type,
          ownerFn,
          currentDispatcherRef,
        );
      case LAZY_NUMBER:
      case LAZY_SYMBOL_STRING: {
        const lazyComponent: LazyComponent<any, any> = (type: any);
        const payload = lazyComponent._payload;
        const init = lazyComponent._init;
        try {
          // Lazy may contain any component type so we recursively resolve it.
          return describeUnknownElementTypeFrameInDEV(
            init(payload),
            ownerFn,
            currentDispatcherRef,
          );
        } catch (x) {}
      }
    }
  }
  return '';
}
