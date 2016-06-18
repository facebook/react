import {Location, LocationStrategy, PathLocationStrategy} from '@angular/common';
import {ApplicationRef, BaseException, ComponentResolver} from '@angular/core';

import {Router, RouterOutletMap} from './router';
import {DefaultRouterUrlSerializer, RouterUrlSerializer} from './router_url_serializer';
import {RouteSegment} from './segments';


/**
 * The Platform agnostic ROUTER PROVIDERS
 */
export const ROUTER_PROVIDERS_COMMON: any[] = /*@ts2dart_const*/[
  RouterOutletMap,
  /*@ts2dart_Provider*/ {provide: RouterUrlSerializer, useClass: DefaultRouterUrlSerializer},
  /*@ts2dart_Provider*/ {provide: LocationStrategy, useClass: PathLocationStrategy}, Location,
  /*@ts2dart_Provider*/ {
    provide: Router,
    useFactory: routerFactory,
    deps: /*@ts2dart_const*/
        [ApplicationRef, ComponentResolver, RouterUrlSerializer, RouterOutletMap, Location],
  },
  /*@ts2dart_Provider*/ {provide: RouteSegment, useFactory: routeSegmentFactory, deps: [Router]}
];

export function routerFactory(
    app: ApplicationRef, componentResolver: ComponentResolver, urlSerializer: RouterUrlSerializer,
    routerOutletMap: RouterOutletMap, location: Location): Router {
  if (app.componentTypes.length == 0) {
    throw new BaseException('Bootstrap at least one component before injecting Router.');
  }
  // TODO: vsavkin this should not be null
  let router = new Router(
      null, app.componentTypes[0], componentResolver, urlSerializer, routerOutletMap, location);
  app.registerDisposeListener(() => router.dispose());
  return router;
}

export function routeSegmentFactory(router: Router): RouteSegment {
  return router.routeTree.root;
}
