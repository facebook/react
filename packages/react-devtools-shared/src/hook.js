/**
 * Install the hook on window, which is an event emitter.
 * Note: this global hook __REACT_DEVTOOLS_GLOBAL_HOOK__ is a de facto public API.
 * It's especially important to avoid creating direct dependency on the DevTools Backend.
 * That's why we still inline the whole event emitter implementation,
 * the string format implementation, and part of the console implementation here.
 *
 * @flow
 */

import type {
  DevToolsHook,
  Handler,
  ReactRenderer,
  RendererID,
  RendererInterface,
  DevToolsBackend,
} from './backend/types';

import {
  FIREFOX_CONSOLE_DIMMING_COLOR,
  ANSI_STYLE_DIMMING_TEMPLATE,
} from 'react-devtools-shared/src/constants';

declare var window: any;

export function installHook(target: any): DevToolsHook | null {
  if (target.hasOwnProperty('__REACT_DEVTOOLS_GLOBAL_HOOK__')) {
    return null;
  }

  let targetConsole: Object = console;
  let targetConsoleMethods: {[string]: $FlowFixMe} = {};
  for (const method in console) {
    // $FlowFixMe[invalid-computed-prop]
    targetConsoleMethods[method] = console[method];
  }

  function dangerous_setTargetConsoleForTesting(
    targetConsoleForTesting: Object,
  ): void {
    targetConsole = targetConsoleForTesting;

    targetConsoleMethods = ({}: {[string]: $FlowFixMe});
    for (const method in targetConsole) {
      // $FlowFixMe[invalid-computed-prop]
      targetConsoleMethods[method] = console[method];
    }
  }

  function detectReactBuildType(renderer: ReactRenderer) {
    try {
      if (typeof renderer.version === 'string') {
        // React DOM Fiber (16+)
        if (renderer.bundleType > 0) {
          // This is not a production build.
          // We are currently only using 0 (PROD) and 1 (DEV)
          // but might add 2 (PROFILE) in the future.
          return 'development';
        }

        // React 16 uses flat bundles. If we report the bundle as production
        // version, it means we also minified and envified it ourselves.
        return 'production';
        // Note: There is still a risk that the CommonJS entry point has not
        // been envified or uglified. In this case the user would have *both*
        // development and production bundle, but only the prod one would run.
        // This would be really bad. We have a separate check for this because
        // it happens *outside* of the renderer injection. See `checkDCE` below.
      }

      // $FlowFixMe[method-unbinding]
      const toString = Function.prototype.toString;
      if (renderer.Mount && renderer.Mount._renderNewRootComponent) {
        // React DOM Stack
        const renderRootCode = toString.call(
          renderer.Mount._renderNewRootComponent,
        );
        // Filter out bad results (if that is even possible):
        if (renderRootCode.indexOf('function') !== 0) {
          // Hope for the best if we're not sure.
          return 'production';
        }
        // Check for React DOM Stack < 15.1.0 in development.
        // If it contains "storedMeasure" call, it's wrapped in ReactPerf (DEV only).
        // This would be true even if it's minified, as method name still matches.
        if (renderRootCode.indexOf('storedMeasure') !== -1) {
          return 'development';
        }
        // For other versions (and configurations) it's not so easy.
        // Let's quickly exclude proper production builds.
        // If it contains a warning message, it's either a DEV build,
        // or an PROD build without proper dead code elimination.
        if (renderRootCode.indexOf('should be a pure function') !== -1) {
          // Now how do we tell a DEV build from a bad PROD build?
          // If we see NODE_ENV, we're going to assume this is a dev build
          // because most likely it is referring to an empty shim.
          if (renderRootCode.indexOf('NODE_ENV') !== -1) {
            return 'development';
          }
          // If we see "development", we're dealing with an envified DEV build
          // (such as the official React DEV UMD).
          if (renderRootCode.indexOf('development') !== -1) {
            return 'development';
          }
          // I've seen process.env.NODE_ENV !== 'production' being smartly
          // replaced by `true` in DEV by Webpack. I don't know how that
          // works but we can safely guard against it because `true` was
          // never used in the function source since it was written.
          if (renderRootCode.indexOf('true') !== -1) {
            return 'development';
          }
          // By now either it is a production build that has not been minified,
          // or (worse) this is a minified development build using non-standard
          // environment (e.g. "staging"). We're going to look at whether
          // the function argument name is mangled:
          if (
            // 0.13 to 15
            renderRootCode.indexOf('nextElement') !== -1 ||
            // 0.12
            renderRootCode.indexOf('nextComponent') !== -1
          ) {
            // We can't be certain whether this is a development build or not,
            // but it is definitely unminified.
            return 'unminified';
          } else {
            // This is likely a minified development build.
            return 'development';
          }
        }
        // By now we know that it's envified and dead code elimination worked,
        // but what if it's still not minified? (Is this even possible?)
        // Let's check matches for the first argument name.
        if (
          // 0.13 to 15
          renderRootCode.indexOf('nextElement') !== -1 ||
          // 0.12
          renderRootCode.indexOf('nextComponent') !== -1
        ) {
          return 'unminified';
        }
        // Seems like we're using the production version.
        // However, the branch above is Stack-only so this is 15 or earlier.
        return 'outdated';
      }
    } catch (err) {
      // Weird environments may exist.
      // This code needs a higher fault tolerance
      // because it runs even with closed DevTools.
      // TODO: should we catch errors in all injected code, and not just this part?
    }
    return 'production';
  }

  function checkDCE(fn: Function) {
    // This runs for production versions of React.
    // Needs to be super safe.
    try {
      // $FlowFixMe[method-unbinding]
      const toString = Function.prototype.toString;
      const code = toString.call(fn);

      // This is a string embedded in the passed function under DEV-only
      // condition. However the function executes only in PROD. Therefore,
      // if we see it, dead code elimination did not work.
      if (code.indexOf('^_^') > -1) {
        // Remember to report during next injection.
        hasDetectedBadDCE = true;

        // Bonus: throw an exception hoping that it gets picked up by a reporting system.
        // Not synchronously so that it doesn't break the calling code.
        setTimeout(function () {
          throw new Error(
            'React is running in production mode, but dead code ' +
              'elimination has not been applied. Read how to correctly ' +
              'configure React for production: ' +
              'https://react.dev/link/perf-use-production-build',
          );
        });
      }
    } catch (err) {}
  }

  // NOTE: KEEP IN SYNC with src/backend/utils.js
  function formatWithStyles(
    inputArgs: $ReadOnlyArray<any>,
    style?: string,
  ): $ReadOnlyArray<any> {
    if (
      inputArgs === undefined ||
      inputArgs === null ||
      inputArgs.length === 0 ||
      // Matches any of %c but not %%c
      (typeof inputArgs[0] === 'string' &&
        inputArgs[0].match(/([^%]|^)(%c)/g)) ||
      style === undefined
    ) {
      return inputArgs;
    }

    // Matches any of %(o|O|d|i|s|f), but not %%(o|O|d|i|s|f)
    const REGEXP = /([^%]|^)((%%)*)(%([oOdisf]))/g;
    if (typeof inputArgs[0] === 'string' && inputArgs[0].match(REGEXP)) {
      return [`%c${inputArgs[0]}`, style, ...inputArgs.slice(1)];
    } else {
      const firstArg = inputArgs.reduce((formatStr, elem, i) => {
        if (i > 0) {
          formatStr += ' ';
        }
        switch (typeof elem) {
          case 'string':
          case 'boolean':
          case 'symbol':
            return (formatStr += '%s');
          case 'number':
            const formatting = Number.isInteger(elem) ? '%i' : '%f';
            return (formatStr += formatting);
          default:
            return (formatStr += '%o');
        }
      }, '%c');
      return [firstArg, style, ...inputArgs];
    }
  }
  // NOTE: KEEP IN SYNC with src/backend/utils.js
  function formatConsoleArguments(
    maybeMessage: any,
    ...inputArgs: $ReadOnlyArray<any>
  ): $ReadOnlyArray<any> {
    if (inputArgs.length === 0 || typeof maybeMessage !== 'string') {
      return [maybeMessage, ...inputArgs];
    }

    const args = inputArgs.slice();

    let template = '';
    let argumentsPointer = 0;
    for (let i = 0; i < maybeMessage.length; ++i) {
      const currentChar = maybeMessage[i];
      if (currentChar !== '%') {
        template += currentChar;
        continue;
      }

      const nextChar = maybeMessage[i + 1];
      ++i;

      // Only keep CSS and objects, inline other arguments
      switch (nextChar) {
        case 'c':
        case 'O':
        case 'o': {
          ++argumentsPointer;
          template += `%${nextChar}`;

          break;
        }
        case 'd':
        case 'i': {
          const [arg] = args.splice(argumentsPointer, 1);
          template += parseInt(arg, 10).toString();

          break;
        }
        case 'f': {
          const [arg] = args.splice(argumentsPointer, 1);
          template += parseFloat(arg).toString();

          break;
        }
        case 's': {
          const [arg] = args.splice(argumentsPointer, 1);
          template += arg.toString();
        }
      }
    }

    return [template, ...args];
  }

  let unpatchFn = null;

  // NOTE: KEEP IN SYNC with src/backend/console.js:patchForStrictMode
  // This function hides or dims console logs during the initial double renderer
  // in Strict Mode. We need this function because during initial render,
  // React and DevTools are connecting and the renderer interface isn't avaiable
  // and we want to be able to have consistent logging behavior for double logs
  // during the initial renderer.
  function patchConsoleForInitialCommitInStrictMode(
    hideConsoleLogsInStrictMode: boolean,
  ) {
    const overrideConsoleMethods = [
      'error',
      'group',
      'groupCollapsed',
      'info',
      'log',
      'trace',
      'warn',
    ];

    if (unpatchFn !== null) {
      // Don't patch twice.
      return;
    }

    const originalConsoleMethods: {[string]: $FlowFixMe} = {};

    unpatchFn = () => {
      for (const method in originalConsoleMethods) {
        try {
          targetConsole[method] = originalConsoleMethods[method];
        } catch (error) {}
      }
    };

    overrideConsoleMethods.forEach(method => {
      try {
        const originalMethod = (originalConsoleMethods[method] = targetConsole[
          method
        ].__REACT_DEVTOOLS_STRICT_MODE_ORIGINAL_METHOD__
          ? targetConsole[method].__REACT_DEVTOOLS_STRICT_MODE_ORIGINAL_METHOD__
          : targetConsole[method]);

        const overrideMethod = (...args: $ReadOnlyArray<any>) => {
          // Dim the text color of the double logs if we're not hiding them.
          if (!hideConsoleLogsInStrictMode) {
            // Firefox doesn't support ANSI escape sequences
            if (__IS_FIREFOX__) {
              originalMethod(
                ...formatWithStyles(args, FIREFOX_CONSOLE_DIMMING_COLOR),
              );
            } else {
              originalMethod(
                ANSI_STYLE_DIMMING_TEMPLATE,
                ...formatConsoleArguments(...args),
              );
            }
          }
        };

        overrideMethod.__REACT_DEVTOOLS_STRICT_MODE_ORIGINAL_METHOD__ =
          originalMethod;
        originalMethod.__REACT_DEVTOOLS_STRICT_MODE_OVERRIDE_METHOD__ =
          overrideMethod;

        targetConsole[method] = overrideMethod;
      } catch (error) {}
    });
  }

  // NOTE: KEEP IN SYNC with src/backend/console.js:unpatchForStrictMode
  function unpatchConsoleForInitialCommitInStrictMode() {
    if (unpatchFn !== null) {
      unpatchFn();
      unpatchFn = null;
    }
  }

  let uidCounter = 0;

  function inject(renderer: ReactRenderer): number {
    const id = ++uidCounter;
    renderers.set(id, renderer);

    const reactBuildType = hasDetectedBadDCE
      ? 'deadcode'
      : detectReactBuildType(renderer);

    // Patching the console enables DevTools to do a few useful things:
    // * Append component stacks to warnings and error messages
    // * Disabling or marking logs during a double render in Strict Mode
    // * Disable logging during re-renders to inspect hooks (see inspectHooksOfFiber)
    //
    // Allow patching console early (during injection) to
    // provide developers with components stacks even if they don't run DevTools.
    if (target.hasOwnProperty('__REACT_DEVTOOLS_CONSOLE_FUNCTIONS__')) {
      const {registerRendererWithConsole, patchConsoleUsingWindowValues} =
        target.__REACT_DEVTOOLS_CONSOLE_FUNCTIONS__;
      if (
        typeof registerRendererWithConsole === 'function' &&
        typeof patchConsoleUsingWindowValues === 'function'
      ) {
        registerRendererWithConsole(renderer);
        patchConsoleUsingWindowValues();
      }
    }

    // If we have just reloaded to profile, we need to inject the renderer interface before the app loads.
    // Otherwise the renderer won't yet exist and we can skip this step.
    const attach = target.__REACT_DEVTOOLS_ATTACH__;
    if (typeof attach === 'function') {
      const rendererInterface = attach(hook, id, renderer, target);
      hook.rendererInterfaces.set(id, rendererInterface);
    }

    hook.emit('renderer', {
      id,
      renderer,
      reactBuildType,
    });

    return id;
  }

  let hasDetectedBadDCE = false;

  function sub(event: string, fn: Handler) {
    hook.on(event, fn);
    return () => hook.off(event, fn);
  }

  function on(event: string, fn: Handler) {
    if (!listeners[event]) {
      listeners[event] = [];
    }
    listeners[event].push(fn);
  }

  function off(event: string, fn: Handler) {
    if (!listeners[event]) {
      return;
    }
    const index = listeners[event].indexOf(fn);
    if (index !== -1) {
      listeners[event].splice(index, 1);
    }
    if (!listeners[event].length) {
      delete listeners[event];
    }
  }

  function emit(event: string, data: any) {
    if (listeners[event]) {
      listeners[event].map(fn => fn(data));
    }
  }

  function getFiberRoots(rendererID: RendererID) {
    const roots = fiberRoots;
    if (!roots[rendererID]) {
      roots[rendererID] = new Set();
    }
    return roots[rendererID];
  }

  function onCommitFiberUnmount(rendererID: RendererID, fiber: any) {
    const rendererInterface = rendererInterfaces.get(rendererID);
    if (rendererInterface != null) {
      rendererInterface.handleCommitFiberUnmount(fiber);
    }
  }

  function onCommitFiberRoot(
    rendererID: RendererID,
    root: any,
    priorityLevel: void | number,
  ) {
    const mountedRoots = hook.getFiberRoots(rendererID);
    const current = root.current;
    const isKnownRoot = mountedRoots.has(root);
    const isUnmounting =
      current.memoizedState == null || current.memoizedState.element == null;

    // Keep track of mounted roots so we can hydrate when DevTools connect.
    if (!isKnownRoot && !isUnmounting) {
      mountedRoots.add(root);
    } else if (isKnownRoot && isUnmounting) {
      mountedRoots.delete(root);
    }
    const rendererInterface = rendererInterfaces.get(rendererID);
    if (rendererInterface != null) {
      rendererInterface.handleCommitFiberRoot(root, priorityLevel);
    }
  }

  function onPostCommitFiberRoot(rendererID: RendererID, root: any) {
    const rendererInterface = rendererInterfaces.get(rendererID);
    if (rendererInterface != null) {
      rendererInterface.handlePostCommitFiberRoot(root);
    }
  }

  function setStrictMode(rendererID: RendererID, isStrictMode: any) {
    const rendererInterface = rendererInterfaces.get(rendererID);
    if (rendererInterface != null) {
      if (isStrictMode) {
        rendererInterface.patchConsoleForStrictMode();
      } else {
        rendererInterface.unpatchConsoleForStrictMode();
      }
    } else {
      // This should only happen during initial commit in the extension before DevTools
      // finishes its handshake with the injected renderer
      if (isStrictMode) {
        const hideConsoleLogsInStrictMode =
          window.__REACT_DEVTOOLS_HIDE_CONSOLE_LOGS_IN_STRICT_MODE__ === true;

        patchConsoleForInitialCommitInStrictMode(hideConsoleLogsInStrictMode);
      } else {
        unpatchConsoleForInitialCommitInStrictMode();
      }
    }
  }

  type StackFrameString = string;

  const openModuleRangesStack: Array<StackFrameString> = [];
  const moduleRanges: Array<[StackFrameString, StackFrameString]> = [];

  function getTopStackFrameString(error: Error): StackFrameString | null {
    const frames = error.stack.split('\n');
    const frame = frames.length > 1 ? frames[1] : null;
    return frame;
  }

  function getInternalModuleRanges(): Array<
    [StackFrameString, StackFrameString],
  > {
    return moduleRanges;
  }

  function registerInternalModuleStart(error: Error) {
    const startStackFrame = getTopStackFrameString(error);
    if (startStackFrame !== null) {
      openModuleRangesStack.push(startStackFrame);
    }
  }

  function registerInternalModuleStop(error: Error) {
    if (openModuleRangesStack.length > 0) {
      const startStackFrame = openModuleRangesStack.pop();
      const stopStackFrame = getTopStackFrameString(error);
      if (stopStackFrame !== null) {
        moduleRanges.push([startStackFrame, stopStackFrame]);
      }
    }
  }

  // TODO: More meaningful names for "rendererInterfaces" and "renderers".
  const fiberRoots: {[RendererID]: Set<mixed>} = {};
  const rendererInterfaces = new Map<RendererID, RendererInterface>();
  const listeners: {[string]: Array<Handler>} = {};
  const renderers = new Map<RendererID, ReactRenderer>();
  const backends = new Map<string, DevToolsBackend>();

  const hook: DevToolsHook = {
    rendererInterfaces,
    listeners,

    backends,

    // Fast Refresh for web relies on this.
    renderers,

    emit,
    getFiberRoots,
    inject,
    on,
    off,
    sub,

    // This is a legacy flag.
    // React v16 checks the hook for this to ensure DevTools is new enough.
    supportsFiber: true,

    // React calls these methods.
    checkDCE,
    onCommitFiberUnmount,
    onCommitFiberRoot,
    onPostCommitFiberRoot,
    setStrictMode,

    // Schedule Profiler runtime helpers.
    // These internal React modules to report their own boundaries
    // which in turn enables the profiler to dim or filter internal frames.
    getInternalModuleRanges,
    registerInternalModuleStart,
    registerInternalModuleStop,
  };

  if (__TEST__) {
    hook.dangerous_setTargetConsoleForTesting =
      dangerous_setTargetConsoleForTesting;
  }

  Object.defineProperty(
    target,
    '__REACT_DEVTOOLS_GLOBAL_HOOK__',
    ({
      // This property needs to be configurable for the test environment,
      // else we won't be able to delete and recreate it between tests.
      configurable: __DEV__,
      enumerable: false,
      get() {
        return hook;
      },
    }: Object),
  );

  return hook;
}
