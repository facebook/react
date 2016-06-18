import {Location, LocationStrategy, PathLocationStrategy} from '@angular/common';
import {ApplicationRef} from '@angular/core';

import {BaseException} from '../src/facade/exceptions';
import {Type} from '../src/facade/lang';

import {ROUTER_PRIMARY_COMPONENT, RouteRegistry} from './route_registry';
import {RootRouter, Router} from './router';


/**
 * The Platform agnostic ROUTER PROVIDERS
 */
export const ROUTER_PROVIDERS_COMMON: any[] = /*@ts2dart_const*/[
  RouteRegistry,
  /* @ts2dart_Provider */ {provide: LocationStrategy, useClass: PathLocationStrategy}, Location, {
    provide: Router,
    useFactory: routerFactory,
    deps: [RouteRegistry, Location, ROUTER_PRIMARY_COMPONENT, ApplicationRef]
  },
  {
    provide: ROUTER_PRIMARY_COMPONENT,
    useFactory: routerPrimaryComponentFactory,
    deps: /*@ts2dart_const*/ ([ApplicationRef])
  }
];

function routerFactory(
    registry: RouteRegistry, location: Location, primaryComponent: Type,
    appRef: ApplicationRef): RootRouter {
  var rootRouter = new RootRouter(registry, location, primaryComponent);
  appRef.registerDisposeListener(() => rootRouter.dispose());
  return rootRouter;
}

function routerPrimaryComponentFactory(app: ApplicationRef): Type {
  if (app.componentTypes.length == 0) {
    throw new BaseException('Bootstrap at least one component before injecting Router.');
  }
  return app.componentTypes[0];
}
