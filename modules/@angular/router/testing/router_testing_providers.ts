import {Location} from '@angular/common';
import {SpyLocation} from '@angular/common/testing';
import {Component, ComponentResolver} from '@angular/core';

import {Router, RouterOutletMap} from '../src/router';
import {DefaultRouterUrlSerializer, RouterUrlSerializer} from '../src/router_url_serializer';
import {RouteSegment} from '../src/segments';

@Component({selector: 'fake-app-root-comp', template: `<span></span>`})
class FakeAppRootCmp {
}

function routerFactory(
    componentResolver: ComponentResolver, urlSerializer: RouterUrlSerializer,
    routerOutletMap: RouterOutletMap, location: Location): Router {
  return new Router(
      null, FakeAppRootCmp, componentResolver, urlSerializer, routerOutletMap, location);
}

export const ROUTER_FAKE_PROVIDERS: any[] = /*@ts2dart_const*/[
  RouterOutletMap,
  /* @ts2dart_Provider */ {provide: Location, useClass: SpyLocation},
  /* @ts2dart_Provider */ {provide: RouterUrlSerializer, useClass: DefaultRouterUrlSerializer},
  /* @ts2dart_Provider */ {
    provide: Router,
    useFactory: routerFactory,
    deps: /*@ts2dart_const*/
        [ComponentResolver, RouterUrlSerializer, RouterOutletMap, Location]
  },
  /*@ts2dart_Provider*/ {
    provide: RouteSegment,
    useFactory: (r: any /** TODO #9100 */) => r.routeTree.root,
    deps: [Router]
  }
];
