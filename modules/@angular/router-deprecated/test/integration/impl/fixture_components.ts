import {Component, ComponentRef, ViewChild, ViewContainerRef} from '@angular/core';
import {DynamicComponentLoader} from '@angular/core/src/linker/dynamic_component_loader';
import {AsyncRoute, ROUTER_DIRECTIVES, Redirect, Route, RouteConfig, RouteData, RouteParams} from '@angular/router-deprecated';

import {PromiseWrapper} from '../../../src/facade/async';
import {isPresent} from '../../../src/facade/lang';

@Component({selector: 'goodbye-cmp', template: `{{farewell}}`})
export class GoodbyeCmp {
  farewell: string;
  constructor() { this.farewell = 'goodbye'; }
}

@Component({selector: 'hello-cmp', template: `{{greeting}}`})
export class HelloCmp {
  greeting: string;
  constructor() { this.greeting = 'hello'; }
}

export function helloCmpLoader() {
  return PromiseWrapper.resolve(HelloCmp);
}


@Component({selector: 'user-cmp', template: `hello {{user}}`})
export class UserCmp {
  user: string;
  constructor(params: RouteParams) { this.user = params.get('name'); }
}

export function userCmpLoader() {
  return PromiseWrapper.resolve(UserCmp);
}


@Component({
  selector: 'parent-cmp',
  template: `inner { <router-outlet></router-outlet> }`,
  directives: [ROUTER_DIRECTIVES],
})
@RouteConfig([new Route({path: '/b', component: HelloCmp, name: 'Child'})])
export class ParentCmp {
}

export function parentCmpLoader() {
  return PromiseWrapper.resolve(ParentCmp);
}


@Component({
  selector: 'parent-cmp',
  template: `inner { <router-outlet></router-outlet> }`,
  directives: [ROUTER_DIRECTIVES],
})
@RouteConfig([new AsyncRoute({path: '/b', loader: helloCmpLoader, name: 'Child'})])
export class AsyncParentCmp {
}

export function asyncParentCmpLoader() {
  return PromiseWrapper.resolve(AsyncParentCmp);
}

@Component({
  selector: 'parent-cmp',
  template: `inner { <router-outlet></router-outlet> }`,
  directives: [ROUTER_DIRECTIVES],
})
@RouteConfig(
    [new AsyncRoute({path: '/b', loader: helloCmpLoader, name: 'Child', useAsDefault: true})])
export class AsyncDefaultParentCmp {
}

export function asyncDefaultParentCmpLoader() {
  return PromiseWrapper.resolve(AsyncDefaultParentCmp);
}


@Component({
  selector: 'parent-cmp',
  template: `inner { <router-outlet></router-outlet> }`,
  directives: [ROUTER_DIRECTIVES],
})
@RouteConfig([new Route({path: '/b', component: HelloCmp, name: 'Child', useAsDefault: true})])
export class ParentWithDefaultCmp {
}

export function parentWithDefaultCmpLoader() {
  return PromiseWrapper.resolve(ParentWithDefaultCmp);
}


@Component({
  selector: 'team-cmp',
  template: `team {{id}} | user { <router-outlet></router-outlet> }`,
  directives: [ROUTER_DIRECTIVES],
})
@RouteConfig([new Route({path: '/user/:name', component: UserCmp, name: 'User'})])
export class TeamCmp {
  id: string;
  constructor(params: RouteParams) { this.id = params.get('id'); }
}

@Component({
  selector: 'team-cmp',
  template: `team {{id}} | user { <router-outlet></router-outlet> }`,
  directives: [ROUTER_DIRECTIVES],
})
@RouteConfig([new AsyncRoute({path: '/user/:name', loader: userCmpLoader, name: 'User'})])
export class AsyncTeamCmp {
  id: string;
  constructor(params: RouteParams) { this.id = params.get('id'); }
}

export function asyncTeamLoader() {
  return PromiseWrapper.resolve(AsyncTeamCmp);
}


@Component({selector: 'data-cmp', template: `{{myData}}`})
export class RouteDataCmp {
  myData: boolean;
  constructor(data: RouteData) { this.myData = data.get('isAdmin'); }
}

export function asyncRouteDataCmp() {
  return PromiseWrapper.resolve(RouteDataCmp);
}

@Component({selector: 'redirect-to-parent-cmp', template: 'redirect-to-parent'})
@RouteConfig([new Redirect({path: '/child-redirect', redirectTo: ['../HelloSib']})])
export class RedirectToParentCmp {
}


@Component({selector: 'dynamic-loader-cmp', template: `{ <div #viewport></div> }`})
@RouteConfig([new Route({path: '/', component: HelloCmp})])
export class DynamicLoaderCmp {
  private _componentRef: ComponentRef<any> = null;

  @ViewChild('viewport', {read: ViewContainerRef}) viewport: ViewContainerRef;

  constructor(private _dynamicComponentLoader: DynamicComponentLoader) {}

  onSomeAction(): Promise<any> {
    if (isPresent(this._componentRef)) {
      this._componentRef.destroy();
      this._componentRef = null;
    }
    return this._dynamicComponentLoader
        .loadNextToLocation(DynamicallyLoadedComponent, this.viewport)
        .then((cmp) => { this._componentRef = cmp; });
  }
}


@Component({
  selector: 'loaded-cmp',
  template: '<router-outlet></router-outlet>',
  directives: [ROUTER_DIRECTIVES]
})
class DynamicallyLoadedComponent {
}
