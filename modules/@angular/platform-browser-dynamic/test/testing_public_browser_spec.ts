import {it, iit, xit, describe, ddescribe, xdescribe, expect, beforeEach, beforeEachProviders, inject,} from '@angular/core/testing';
import {async, fakeAsync, flushMicrotasks, Log, tick,} from '@angular/core/testing';

import {ROUTER_FAKE_PROVIDERS} from '@angular/router/testing';
import {ROUTER_DIRECTIVES, Routes, Route} from '@angular/router';


import {Component, bind} from '@angular/core';
import {PromiseWrapper} from '../src/facade/promise';
import {XHR} from '@angular/compiler';
import {XHRImpl} from '../src/xhr/xhr_impl';
import {TestComponentBuilder} from '@angular/compiler/testing';

// Components for the tests.
class FancyService {
  value: string = 'real value';
  getAsyncValue() { return Promise.resolve('async value'); }
  getTimeoutValue() {
    return new Promise((resolve, reject) => { setTimeout(() => {resolve('timeout value')}, 10); })
  }
}

@Component({
  selector: 'external-template-comp',
  templateUrl: '/base/modules/@angular/platform-browser/test/static_assets/test.html'
})
class ExternalTemplateComp {
}

@Component({selector: 'bad-template-comp', templateUrl: 'non-existant.html'})
class BadTemplateUrl {
}

@Component({
  selector: 'test-router-cmp',
  template:
      `<a [routerLink]="['One']">one</a> <a [routerLink]="['Two']">two</a><router-outlet></router-outlet>`,
  directives: [ROUTER_DIRECTIVES]
})
@Routes([
  new Route({path: '/One', component: BadTemplateUrl}),
  new Route({path: '/Two', component: ExternalTemplateComp}),
])
class TestRouterComponent {
}

// Tests for angular2/testing bundle specific to the browser environment.
// For general tests, see test/testing/testing_public_spec.ts.
export function main() {
  describe('test APIs for the browser', () => {
    describe('angular2 jasmine matchers', () => {
      describe('toHaveCssClass', () => {
        it('should assert that the CSS class is present', () => {
          var el = document.createElement('div');
          el.classList.add('matias');
          expect(el).toHaveCssClass('matias');
        });

        it('should assert that the CSS class is not present', () => {
          var el = document.createElement('div');
          el.classList.add('matias');
          expect(el).not.toHaveCssClass('fatias');
        });
      });

      describe('toHaveCssStyle', () => {
        it('should assert that the CSS style is present', () => {
          var el = document.createElement('div');
          expect(el).not.toHaveCssStyle('width');

          el.style.setProperty('width', '100px');
          expect(el).toHaveCssStyle('width');
        });

        it('should assert that the styles are matched against the element', () => {
          var el = document.createElement('div');
          expect(el).not.toHaveCssStyle({width: '100px', height: '555px'});

          el.style.setProperty('width', '100px');
          expect(el).toHaveCssStyle({width: '100px'});
          expect(el).not.toHaveCssStyle({width: '100px', height: '555px'});

          el.style.setProperty('height', '555px');
          expect(el).toHaveCssStyle({height: '555px'});
          expect(el).toHaveCssStyle({width: '100px', height: '555px'});
        });
      });
    });

    describe('using the async helper', () => {
      var actuallyDone: boolean;

      beforeEach(() => { actuallyDone = false; });

      afterEach(() => { expect(actuallyDone).toEqual(true); });

      it('should run async tests with XHRs', async(() => {
           var xhr = new XHRImpl();
           xhr.get('/base/modules/@angular/platform-browser/test/static_assets/test.html')
               .then(() => { actuallyDone = true; });
         }),
         10000);  // Long timeout here because this test makes an actual XHR.
    });

    describe('using the test injector with the inject helper', () => {
      describe('setting up Providers', () => {
        beforeEachProviders(() => [{provide: FancyService, useValue: new FancyService()}]);

        it('provides a real XHR instance',
           inject([XHR], (xhr: XHR) => { expect(xhr).toBeAnInstanceOf(XHRImpl); }));

        it('should allow the use of fakeAsync',
           fakeAsync(inject([FancyService], (service: any /** TODO #9100 */) => {
             var value: any /** TODO #9100 */;
             service.getAsyncValue().then(function(val: any /** TODO #9100 */) { value = val; });
             tick();
             expect(value).toEqual('async value');
           })));
      });
    });

    describe('errors', () => {
      var originalJasmineIt: any;

      var patchJasmineIt = () => {
        var deferred = PromiseWrapper.completer();
        originalJasmineIt = jasmine.getEnv().it;
        jasmine.getEnv().it = (description: string, fn: any /** TODO #9100 */) => {
          var done = () => { deferred.resolve() };
          (<any>done).fail = (err: any /** TODO #9100 */) => { deferred.reject(err) };
          fn(done);
          return null;
        };
        return deferred.promise;
      };

      var restoreJasmineIt = () => { jasmine.getEnv().it = originalJasmineIt; };

      it('should fail when an XHR fails', (done: any /** TODO #9100 */) => {
        var itPromise = patchJasmineIt();

        it('should fail with an error from a promise',
           async(inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
             return tcb.createAsync(BadTemplateUrl);
           })));

        itPromise.then(
            () => { done.fail('Expected test to fail, but it did not'); },
            (err) => {
              expect(err).toEqual('Uncaught (in promise): Failed to load non-existant.html');
              done();
            });
        restoreJasmineIt();
      }, 10000);
    });

    describe('test component builder', function() {
      it('should allow an external templateUrl',
         async(inject(
             [TestComponentBuilder],
             (tcb: TestComponentBuilder) => {

               tcb.createAsync(ExternalTemplateComp).then((componentFixture) => {
                 componentFixture.detectChanges();
                 expect(componentFixture.debugElement.nativeElement)
                     .toHaveText('from external template\n');
               });
             })),
         10000);  // Long timeout here because this test makes an actual XHR, and is slow on Edge.
    });
  });

  describe('apps with router components', () => {
    beforeEachProviders(() => [ROUTER_FAKE_PROVIDERS]);

    it('should build without a problem',
       async(inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
         tcb.createAsync(TestRouterComponent).then((fixture) => {
           expect(fixture.nativeElement).toHaveText('one two');
         });
       })));
  });
}
