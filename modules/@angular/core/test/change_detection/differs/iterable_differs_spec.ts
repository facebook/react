import {Injector, ReflectiveInjector, provide} from '@angular/core';
import {IterableDiffers} from '@angular/core/src/change_detection/differs/iterable_differs';
import {afterEach, beforeEach, ddescribe, describe, expect, iit, it, xit} from '@angular/core/testing/testing_internal';

import {SpyIterableDifferFactory} from '../../spies';

export function main() {
  describe('IterableDiffers', function() {
    var factory1: any /** TODO #9100 */;
    var factory2: any /** TODO #9100 */;
    var factory3: any /** TODO #9100 */;

    beforeEach(() => {
      factory1 = new SpyIterableDifferFactory();
      factory2 = new SpyIterableDifferFactory();
      factory3 = new SpyIterableDifferFactory();
    });

    it('should throw when no suitable implementation found', () => {
      var differs = new IterableDiffers([]);
      expect(() => differs.find('some object'))
          .toThrowErrorWith('Cannot find a differ supporting object \'some object\'')
    });

    it('should return the first suitable implementation', () => {
      factory1.spy('supports').andReturn(false);
      factory2.spy('supports').andReturn(true);
      factory3.spy('supports').andReturn(true);

      var differs = IterableDiffers.create(<any>[factory1, factory2, factory3]);
      expect(differs.find('some object')).toBe(factory2);
    });

    it('should copy over differs from the parent repo', () => {
      factory1.spy('supports').andReturn(true);
      factory2.spy('supports').andReturn(false);

      var parent = IterableDiffers.create(<any>[factory1]);
      var child = IterableDiffers.create(<any>[factory2], parent);

      expect(child.factories).toEqual([factory2, factory1]);
    });

    describe('.extend()', () => {
      it('should throw if calling extend when creating root injector', () => {
        var injector = ReflectiveInjector.resolveAndCreate([IterableDiffers.extend([])]);

        expect(() => injector.get(IterableDiffers))
            .toThrowErrorWith('Cannot extend IterableDiffers without a parent injector');
      });

      it('should extend di-inherited diffesr', () => {
        var parent = new IterableDiffers([factory1]);
        var injector =
            ReflectiveInjector.resolveAndCreate([{provide: IterableDiffers, useValue: parent}]);
        var childInjector = injector.resolveAndCreateChild([IterableDiffers.extend([factory2])]);

        expect(injector.get(IterableDiffers).factories).toEqual([factory1]);
        expect(childInjector.get(IterableDiffers).factories).toEqual([factory2, factory1]);
      });
    });
  });
}
