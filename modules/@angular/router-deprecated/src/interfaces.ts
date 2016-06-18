import {global} from '../src/facade/lang';

import {ComponentInstruction} from './instruction';


// This is here only so that after TS transpilation the file is not empty.
// TODO(rado): find a better way to fix this, or remove if likely culprit
// https://github.com/systemjs/systemjs/issues/487 gets closed.
var __ignore_me = global;
var __make_dart_analyzer_happy: Promise<any> = null;

/**
 * Defines route lifecycle method `routerOnActivate`, which is called by the router at the end of a
 * successful route navigation.
 *
 * For a single component's navigation, only one of either {@link OnActivate} or {@link OnReuse}
 * will be called depending on the result of {@link CanReuse}.
 *
 * The `routerOnActivate` hook is called with two {@link ComponentInstruction}s as parameters, the
 * first
 * representing the current route being navigated to, and the second parameter representing the
 * previous route or `null`.
 *
 * If `routerOnActivate` returns a promise, the route change will wait until the promise settles to
 * instantiate and activate child components.
 *
 * ### Example
 * {@example router/ts/on_activate/on_activate_example.ts region='routerOnActivate'}
 */
export interface OnActivate {
  routerOnActivate(nextInstruction: ComponentInstruction, prevInstruction: ComponentInstruction):
      any|Promise<any>;
}

/**
 * Defines route lifecycle method `routerOnReuse`, which is called by the router at the end of a
 * successful route navigation when {@link CanReuse} is implemented and returns or resolves to true.
 *
 * For a single component's navigation, only one of either {@link OnActivate} or {@link OnReuse}
 * will be called, depending on the result of {@link CanReuse}.
 *
 * The `routerOnReuse` hook is called with two {@link ComponentInstruction}s as parameters, the
 * first
 * representing the current route being navigated to, and the second parameter representing the
 * previous route or `null`.
 *
 * ### Example
 * {@example router/ts/reuse/reuse_example.ts region='reuseCmp'}
 */
export interface OnReuse {
  routerOnReuse(nextInstruction: ComponentInstruction, prevInstruction: ComponentInstruction): any
      |Promise<any>;
}

/**
 * Defines route lifecycle method `routerOnDeactivate`, which is called by the router before
 * destroying
 * a component as part of a route change.
 *
 * The `routerOnDeactivate` hook is called with two {@link ComponentInstruction}s as parameters, the
 * first
 * representing the current route being navigated to, and the second parameter representing the
 * previous route.
 *
 * If `routerOnDeactivate` returns a promise, the route change will wait until the promise settles.
 *
 * ### Example
 * {@example router/ts/on_deactivate/on_deactivate_example.ts region='routerOnDeactivate'}
 */
export interface OnDeactivate {
  routerOnDeactivate(nextInstruction: ComponentInstruction, prevInstruction: ComponentInstruction):
      any|Promise<any>;
}

/**
 * Defines route lifecycle method `routerCanReuse`, which is called by the router to determine
 * whether a
 * component should be reused across routes, or whether to destroy and instantiate a new component.
 *
 * The `routerCanReuse` hook is called with two {@link ComponentInstruction}s as parameters, the
 * first
 * representing the current route being navigated to, and the second parameter representing the
 * previous route.
 *
 * If `routerCanReuse` returns or resolves to `true`, the component instance will be reused and the
 * {@link OnDeactivate} hook will be run. If `routerCanReuse` returns or resolves to `false`, a new
 * component will be instantiated, and the existing component will be deactivated and removed as
 * part of the navigation.
 *
 * If `routerCanReuse` throws or rejects, the navigation will be cancelled.
 *
 * ### Example
 * {@example router/ts/reuse/reuse_example.ts region='reuseCmp'}
 */
export interface CanReuse {
  routerCanReuse(nextInstruction: ComponentInstruction, prevInstruction: ComponentInstruction):
      boolean|Promise<boolean>;
}

/**
 * Defines route lifecycle method `routerCanDeactivate`, which is called by the router to determine
 * if a component can be removed as part of a navigation.
 *
 * The `routerCanDeactivate` hook is called with two {@link ComponentInstruction}s as parameters,
 * the
 * first representing the current route being navigated to, and the second parameter
 * representing the previous route.
 *
 * If `routerCanDeactivate` returns or resolves to `false`, the navigation is cancelled. If it
 * returns or
 * resolves to `true`, then the navigation continues, and the component will be deactivated
 * (the {@link OnDeactivate} hook will be run) and removed.
 *
 * If `routerCanDeactivate` throws or rejects, the navigation is also cancelled.
 *
 * ### Example
 * {@example router/ts/can_deactivate/can_deactivate_example.ts region='routerCanDeactivate'}
 */
export interface CanDeactivate {
  routerCanDeactivate(nextInstruction: ComponentInstruction, prevInstruction: ComponentInstruction):
      boolean|Promise<boolean>;
}
