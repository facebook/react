import {Location, LocationStrategy} from '@angular/common';
import {MockLocationStrategy, SpyLocation} from '@angular/common/testing';
import {Component, ComponentResolver, provide} from '@angular/core';
import {AsyncTestCompleter, beforeEach, beforeEachProviders, ddescribe, describe, expect, iit, inject, it, xdescribe, xit} from '@angular/core/testing/testing_internal';
import {CanDeactivate, DefaultRouterUrlSerializer, OnActivate, ROUTER_DIRECTIVES, Route, RouteSegment, Router, RouterOutletMap, RouterUrlSerializer, Routes} from '@angular/router';

import {RouterLink} from '../src/directives/router_link';

export function main() {
  describe('RouterLink', () => {
    beforeEachProviders(
        () =>
            [{provide: RouterUrlSerializer, useClass: DefaultRouterUrlSerializer}, RouterOutletMap,
             {provide: Location, useClass: SpyLocation},
             {provide: LocationStrategy, useClass: MockLocationStrategy}, {
               provide: Router,
               useFactory:
                   (resolver: any /** TODO #9100 */, urlParser: any /** TODO #9100 */,
                    outletMap: any /** TODO #9100 */, location: any /** TODO #9100 */) =>
                       new Router(
                           'RootComponent', RootCmp, resolver, urlParser, outletMap, location),
               deps: [ComponentResolver, RouterUrlSerializer, RouterOutletMap, Location]
             }]);

    describe('routerLink=', () => {
      it('should accept an array of commands',
         inject(
             [Router, LocationStrategy],
             (router: any /** TODO #9100 */, locationStrategy: any /** TODO #9100 */) => {
               let link = new RouterLink(null, router, locationStrategy);
               link.routerLink = ['/one', 11];
               expect(link.href).toEqual('/one/11');
             }));

      it('should accept a single command',
         inject(
             [Router, LocationStrategy],
             (router: any /** TODO #9100 */, locationStrategy: any /** TODO #9100 */) => {
               let link = new RouterLink(null, router, locationStrategy);
               link.routerLink = '/one/11';
               expect(link.href).toEqual('/one/11');
             }));
    });
  });
}

@Component({template: ''})
class RootCmp {
}
