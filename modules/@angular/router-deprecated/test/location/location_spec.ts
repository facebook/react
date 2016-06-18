import {describe, it, iit, ddescribe, expect, inject, beforeEach, beforeEachProviders,} from '@angular/core/testing/testing_internal';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';

import {Injector, provide, ReflectiveInjector} from '@angular/core';
import {Location, LocationStrategy, APP_BASE_HREF} from '@angular/common';
import {MockLocationStrategy} from '@angular/common/testing';

export function main() {
  describe('Location', () => {

    var locationStrategy: any /** TODO #9100 */, location: any /** TODO #9100 */;

    function makeLocation(
        baseHref: string = '/my/app', provider: any = /*@ts2dart_const*/[]): Location {
      locationStrategy = new MockLocationStrategy();
      locationStrategy.internalBaseHref = baseHref;
      let injector = ReflectiveInjector.resolveAndCreate(
          [Location, {provide: LocationStrategy, useValue: locationStrategy}, provider]);
      return location = injector.get(Location);
    }

    beforeEach(makeLocation);

    it('should not prepend urls with starting slash when an empty URL is provided',
       () => { expect(location.prepareExternalUrl('')).toEqual(locationStrategy.getBaseHref()); });

    it('should not prepend path with an extra slash when a baseHref has a trailing slash', () => {
      let location = makeLocation('/my/slashed/app/');
      expect(location.prepareExternalUrl('/page')).toEqual('/my/slashed/app/page');
    });

    it('should not append urls with leading slash on navigate', () => {
      location.go('/my/app/user/btford');
      expect(locationStrategy.path()).toEqual('/my/app/user/btford');
    });

    it('should normalize urls on popstate',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {

         location.subscribe((ev: any /** TODO #9100 */) => {
           expect(ev['url']).toEqual('/user/btford');
           async.done();
         });
         locationStrategy.simulatePopState('/my/app/user/btford');
       }));

    it('should revert to the previous path when a back() operation is executed', () => {
      var locationStrategy = new MockLocationStrategy();
      var location = new Location(locationStrategy);

      function assertUrl(path: any /** TODO #9100 */) { expect(location.path()).toEqual(path); }

      location.go('/ready');
      assertUrl('/ready');

      location.go('/ready/set');
      assertUrl('/ready/set');

      location.go('/ready/set/go');
      assertUrl('/ready/set/go');

      location.back();
      assertUrl('/ready/set');

      location.back();
      assertUrl('/ready');
    });

    it('should incorporate the provided query values into the location change', () => {
      var locationStrategy = new MockLocationStrategy();
      var location = new Location(locationStrategy);

      location.go('/home', 'key=value');
      expect(location.path()).toEqual('/home?key=value');
    });
  });
}
