import {provide} from '@angular/core';
import {ComponentFactory} from '@angular/core/src/linker/component_factory';
import {ComponentResolver, ReflectorComponentResolver} from '@angular/core/src/linker/component_resolver';
import {ReflectionInfo, reflector} from '@angular/core/src/reflection/reflection';
import {afterEach, beforeEach, beforeEachProviders, ddescribe, describe, expect, iit, inject, it, xdescribe, xit} from '@angular/core/testing/testing_internal';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';

export function main() {
  describe('Compiler', () => {
    var someCompFactory: any /** TODO #9100 */;

    beforeEachProviders(() => [{provide: ComponentResolver, useClass: ReflectorComponentResolver}]);

    beforeEach(inject([ComponentResolver], (_compiler: ComponentResolver) => {
      someCompFactory = new ComponentFactory(null, null, null);
      reflector.registerType(SomeComponent, new ReflectionInfo([someCompFactory]));
    }));

    it('should read the template from an annotation',
       inject(
           [AsyncTestCompleter, ComponentResolver],
           (async: AsyncTestCompleter, compiler: ComponentResolver) => {
             compiler.resolveComponent(SomeComponent).then((compFactory: ComponentFactory<any>) => {
               expect(compFactory).toBe(someCompFactory);
               async.done();
               return null;
             });
           }));

    it('should throw when given a string',
       inject(
           [AsyncTestCompleter, ComponentResolver],
           (async: AsyncTestCompleter, compiler: ComponentResolver) => {
             compiler.resolveComponent('someString').catch((e) => {
               expect(e.message).toContain('Cannot resolve component using \'someString\'.')
                   async.done();
             });
           }));
  });
}

class SomeComponent {}
