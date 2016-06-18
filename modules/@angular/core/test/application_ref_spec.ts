import {ddescribe, describe, it, iit, xit, expect, beforeEach, afterEach, inject,} from '@angular/core/testing/testing_internal';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';
import {Type} from '@angular/core';
import {SpyChangeDetectorRef} from './spies';
import {ApplicationRef_, ApplicationRef, PLATFORM_CORE_PROVIDERS, APPLICATION_CORE_PROVIDERS} from '@angular/core/src/application_ref';
import {Injector, APP_INITIALIZER, Component, ReflectiveInjector, coreLoadAndBootstrap, PlatformRef, createPlatform, disposePlatform, ComponentResolver, ChangeDetectorRef} from '@angular/core';
import {Console} from '@angular/core/src/console';
import {BaseException} from '../src/facade/exceptions';
import {PromiseWrapper, PromiseCompleter, TimerWrapper} from '../src/facade/async';
import {ComponentFactory, ComponentRef_, ComponentRef} from '@angular/core/src/linker/component_factory';
import {ExceptionHandler} from '../src/facade/exception_handler';

export function main() {
  describe('bootstrap', () => {
    var platform: PlatformRef;
    var errorLogger: _ArrayLogger;
    var someCompFactory: ComponentFactory<any>;

    beforeEach(() => {
      errorLogger = new _ArrayLogger();
      disposePlatform();
      platform = createPlatform(ReflectiveInjector.resolveAndCreate(PLATFORM_CORE_PROVIDERS));
      someCompFactory =
          new _MockComponentFactory(new _MockComponentRef(ReflectiveInjector.resolveAndCreate([])));
    });

    afterEach(() => { disposePlatform(); });

    function createApplication(providers: any[]): ApplicationRef_ {
      var appInjector = ReflectiveInjector.resolveAndCreate(
          [
            APPLICATION_CORE_PROVIDERS, {provide: Console, useValue: new _MockConsole()},
            {provide: ExceptionHandler, useValue: new ExceptionHandler(errorLogger, false)},
            {provide: ComponentResolver, useValue: new _MockComponentResolver(someCompFactory)},
            providers
          ],
          platform.injector);
      return appInjector.get(ApplicationRef);
    }

    describe('ApplicationRef', () => {
      it('should throw when reentering tick', () => {
        var cdRef = <any>new SpyChangeDetectorRef();
        var ref = createApplication([]);
        try {
          ref.registerChangeDetector(cdRef);
          cdRef.spy('detectChanges').andCallFake(() => ref.tick());
          expect(() => ref.tick()).toThrowError('ApplicationRef.tick is called recursively');
        } finally {
          ref.unregisterChangeDetector(cdRef);
        }
      });

      describe('run', () => {
        it('should rethrow errors even if the exceptionHandler is not rethrowing', () => {
          var ref = createApplication([]);
          expect(() => ref.run(() => { throw new BaseException('Test'); })).toThrowError('Test');
        });

        it('should return a promise with rejected errors even if the exceptionHandler is not rethrowing',
           inject(
               [AsyncTestCompleter, Injector], (async: AsyncTestCompleter, injector: Injector) => {
                 var ref = createApplication([]);
                 var promise = ref.run(() => PromiseWrapper.reject('Test', null));
                 PromiseWrapper.catchError(promise, (e) => {
                   expect(e).toEqual('Test');
                   async.done();
                 });
               }));
      });
    });

    describe('coreLoadAndBootstrap', () => {
      it('should wait for asynchronous app initializers',
         inject([AsyncTestCompleter, Injector], (async: AsyncTestCompleter, injector: Injector) => {
           let completer: PromiseCompleter<any> = PromiseWrapper.completer();
           var initializerDone = false;
           TimerWrapper.setTimeout(() => {
             completer.resolve(true);
             initializerDone = true;
           }, 1);
           var app = createApplication(
               [{provide: APP_INITIALIZER, useValue: () => completer.promise, multi: true}]);
           coreLoadAndBootstrap(MyComp6, app.injector).then(_ => {
             expect(initializerDone).toBe(true);
             async.done();
           });
         }));
    });

    describe('coreBootstrap', () => {
      it('should throw if an APP_INITIIALIZER is not yet resolved',
         inject([Injector], (injector: Injector) => {
           var app = createApplication([{
             provide: APP_INITIALIZER,
             useValue: () => PromiseWrapper.completer().promise,
             multi: true
           }]);
           expect(() => app.bootstrap(someCompFactory))
               .toThrowError(
                   'Cannot bootstrap as there are still asynchronous initializers running. Wait for them using waitForAsyncInitializers().');
         }));
    });
  });
}

@Component({selector: 'my-comp', template: ''})
class MyComp6 {
}

class _ArrayLogger {
  res: any[] = [];
  log(s: any): void { this.res.push(s); }
  logError(s: any): void { this.res.push(s); }
  logGroup(s: any): void { this.res.push(s); }
  logGroupEnd(){};
}

class _MockComponentFactory extends ComponentFactory<any> {
  constructor(private _compRef: ComponentRef<any>) { super(null, null, null); }
  create(
      injector: Injector, projectableNodes: any[][] = null,
      rootSelectorOrNode: string|any = null): ComponentRef<any> {
    return this._compRef;
  }
}

class _MockComponentResolver implements ComponentResolver {
  constructor(private _compFactory: ComponentFactory<any>) {}

  resolveComponent(type: Type): Promise<ComponentFactory<any>> {
    return PromiseWrapper.resolve(this._compFactory);
  }
  clearCache() {}
}

class _MockComponentRef extends ComponentRef_<any> {
  constructor(private _injector: Injector) { super(null, null); }
  get injector(): Injector { return this._injector; }
  get changeDetectorRef(): ChangeDetectorRef { return <any>new SpyChangeDetectorRef(); }
  onDestroy(cb: Function) {}
}

class _MockConsole implements Console {
  log(message: any /** TODO #9100 */) {}
  warn(message: any /** TODO #9100 */) {}
}
