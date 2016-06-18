import {Location} from '@angular/common';
import {Directive} from '@angular/core';

import {isString} from '../facade/lang';
import {Instruction} from '../instruction';
import {Router} from '../router';


/**
 * The RouterLink directive lets you link to specific parts of your app.
 *
 * Consider the following route configuration:

 * ```
 * @RouteConfig([
 *   { path: '/user', component: UserCmp, name: 'User' }
 * ]);
 * class MyComp {}
 * ```
 *
 * When linking to this `User` route, you can write:
 *
 * ```
 * <a [routerLink]="['./User']">link to user component</a>
 * ```
 *
 * RouterLink expects the value to be an array of route names, followed by the params
 * for that level of routing. For instance `['/Team', {teamId: 1}, 'User', {userId: 2}]`
 * means that we want to generate a link for the `Team` route with params `{teamId: 1}`,
 * and with a child route `User` with params `{userId: 2}`.
 *
 * The first route name should be prepended with `/`, `./`, or `../`.
 * If the route begins with `/`, the router will look up the route from the root of the app.
 * If the route begins with `./`, the router will instead look in the current component's
 * children for the route. And if the route begins with `../`, the router will look at the
 * current component's parent.
 */
@Directive({
  selector: '[routerLink]',
  inputs: ['routeParams: routerLink', 'target: target'],
  host: {
    '(click)': 'onClick()',
    '[attr.href]': 'visibleHref',
    '[class.router-link-active]': 'isRouteActive'
  }
})
export class RouterLink {
  private _routeParams: any[];

  // the url displayed on the anchor element.
  visibleHref: string;
  target: string;

  // the instruction passed to the router to navigate
  private _navigationInstruction: Instruction;

  constructor(private _router: Router, private _location: Location) {
    // we need to update the link whenever a route changes to account for aux routes
    this._router.subscribe((_) => this._updateLink());
  }

  // because auxiliary links take existing primary and auxiliary routes into account,
  // we need to update the link whenever params or other routes change.
  private _updateLink(): void {
    this._navigationInstruction = this._router.generate(this._routeParams);
    var navigationHref = this._navigationInstruction.toLinkUrl();
    this.visibleHref = this._location.prepareExternalUrl(navigationHref);
  }

  get isRouteActive(): boolean { return this._router.isRouteActive(this._navigationInstruction); }

  set routeParams(changes: any[]) {
    this._routeParams = changes;
    this._updateLink();
  }

  onClick(): boolean {
    // If no target, or if target is _self, prevent default browser behavior
    if (!isString(this.target) || this.target == '_self') {
      this._router.navigateByInstruction(this._navigationInstruction);
      return false;
    }
    return true;
  }
}
