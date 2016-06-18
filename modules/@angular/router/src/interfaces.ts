import {RouteSegment, RouteTree, Tree} from './segments';


/**
 * Defines route lifecycle method `routerOnActivate`, which is called by the router at the end of a
 * successful route navigation.
 *
 * The `routerOnActivate` hook is called with the current and previous {@link RouteSegment}s of the
 * component and with the corresponding route trees.
 */
export interface OnActivate {
  routerOnActivate(
      curr: RouteSegment, prev?: RouteSegment, currTree?: RouteTree, prevTree?: RouteTree): void;
}

/**
 * Defines route lifecycle method `routerOnDeactivate`, which is called by the router before
 * destroying a component as part of a route change.
 *
 * The `routerOnDeactivate` hook is called with two {@link RouteTree}s, representing the current
 * and the future state of the application.
 *
 * `routerOnDeactivate` must return a promise. The route change will wait until the promise settles.
 */
export interface CanDeactivate {
  routerCanDeactivate(currTree?: RouteTree, futureTree?: RouteTree): Promise<boolean>;
}