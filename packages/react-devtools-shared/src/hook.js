/**
 * Install the hook on window, which is an event emitter.
 * Note because Chrome content scripts cannot directly modify the window object,
 * we are evaling this function by inserting a script tag.
 * That's why we have to inline the whole event emitter implementation here.
 *
 * @flow
 */

import {
  patch as patchConsole,
  registerRenderer as registerRendererWithConsole,
} from './backend/console';

import type {DevToolsHook} from 'react-devtools-shared/src/backend/types';

declare var window: any;

export function installHook(target: any): DevToolsHook | null {
  if (target.hasOwnProperty('__REACT_DEVTOOLS_GLOBAL_HOOK__')) {
    return null;
  }

  function detectReactBuildType(renderer) {
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
        setTimeout(function() {
          throw new Error(
            'React is running in production mode, but dead code ' +
              'elimination has not been applied. Read how to correctly ' +
              'configure React for production: ' +
              'https://fb.me/react-perf-use-the-production-build',
          );
        });
      }
    } catch (err) {}
  }

  let uidCounter = 0;

  function inject(renderer) {
    const id = ++uidCounter;
    renderers.set(id, renderer);

    const reactBuildType = hasDetectedBadDCE
      ? 'deadcode'
      : detectReactBuildType(renderer);

    // Patching the console enables DevTools to do a few useful things:
    // * Append component stacks to warnings and error messages
    // * Disable logging during re-renders to inspect hooks (see inspectHooksOfFiber)
    //
    // For React Native, we intentionally patch early (during injection).
    // This provides React Native developers with components stacks even if they don't run DevTools.
    // This won't work for DOM though, since this entire file is eval'ed and inserted as a script tag.
    // In that case, we'll patch later (when the frontend attaches).
    //
    // Don't patch in test environments because we don't want to interfere with Jest's own console overrides.
    if (process.env.NODE_ENV !== 'test') {
      try {
        // The installHook() function is injected by being stringified in the browser,
        // so imports outside of this function do not get included.
        //
        // Normally we could check "typeof patchConsole === 'function'",
        // but Webpack wraps imports with an object (e.g. _backend_console__WEBPACK_IMPORTED_MODULE_0__)
        // and the object itself will be undefined as well for the reasons mentioned above,
        // so we use try/catch instead.
        if (window.__REACT_DEVTOOLS_APPEND_COMPONENT_STACK__ !== false) {
          registerRendererWithConsole(renderer);
          patchConsole();
        }
      } catch (error) {}
    }

    // If we have just reloaded to profile, we need to inject the renderer interface before the app loads.
    // Otherwise the renderer won't yet exist and we can skip this step.
    const attach = target.__REACT_DEVTOOLS_ATTACH__;
    if (typeof attach === 'function') {
      const rendererInterface = attach(hook, id, renderer, target);
      hook.rendererInterfaces.set(id, rendererInterface);
    }

    hook.emit('renderer', {id, renderer, reactBuildType});

    return id;
  }

  let hasDetectedBadDCE = false;

  function sub(event, fn) {
    hook.on(event, fn);
    return () => hook.off(event, fn);
  }

  function on(event, fn) {
    if (!listeners[event]) {
      listeners[event] = [];
    }
    listeners[event].push(fn);
  }

  function off(event, fn) {
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

  function emit(event, data) {
    if (listeners[event]) {
      listeners[event].map(fn => fn(data));
    }
  }

  function getFiberRoots(rendererID) {
    const roots = fiberRoots;
    if (!roots[rendererID]) {
      roots[rendererID] = new Set();
    }
    return roots[rendererID];
  }

  function onCommitFiberUnmount(rendererID, fiber) {
    const rendererInterface = rendererInterfaces.get(rendererID);
    if (rendererInterface != null) {
      rendererInterface.handleCommitFiberUnmount(fiber);
    }
  }

  function onCommitFiberRoot(rendererID, root, priorityLevel) {
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

  // TODO: More meaningful names for "rendererInterfaces" and "renderers".
  const fiberRoots = {};
  const rendererInterfaces = new Map();
  const listeners = {};
  const renderers = new Map();

  const hook: DevToolsHook = {
    rendererInterfaces,
    listeners,

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
  };

  Object.defineProperty(
    target,
    '__REACT_DEVTOOLS_GLOBAL_HOOK__',
    ({
      // This property needs to be configurable for the test environment,
      // else we won't be able to delete and recreate it beween tests.
      configurable: __DEV__,
      enumerable: false,
      get() {
        return hook;
      },
    }: Object),
  );

  return hook;
}
