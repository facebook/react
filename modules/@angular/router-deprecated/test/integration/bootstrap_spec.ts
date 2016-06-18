import {beforeEach, beforeEachProviders, ddescribe, describe, expect, iit, inject, it, xdescribe, xit,} from '@angular/core/testing/testing_internal';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';
import {TestComponentBuilder} from '@angular/compiler/testing';

import {bootstrap} from '@angular/platform-browser-dynamic';
import {APP_BASE_HREF, LocationStrategy} from '@angular/common';
import {Component} from '@angular/core/src/metadata';
import {getDOM} from '@angular/platform-browser/src/dom/dom_adapter';
import {Console} from '@angular/core/src/console';
import {DOCUMENT} from '@angular/platform-browser/src/dom/dom_tokens';
import {RouteConfig, Route, AuxRoute} from '../../src/route_config/route_config_decorator';
import {PromiseWrapper} from '../../src/facade/async';
import {BaseException} from '../../src/facade/exceptions';
import {ROUTER_PROVIDERS, ROUTER_PRIMARY_COMPONENT, RouteParams, Router, ROUTER_DIRECTIVES} from '@angular/router-deprecated';

import {MockLocationStrategy} from '@angular/common/testing';
import {ApplicationRef} from '@angular/core/src/application_ref';
import {MockApplicationRef} from '@angular/core/testing';

// noinspection JSAnnotator
class DummyConsole implements Console {
  log(message: any /** TODO #9100 */) {}
  warn(message: any /** TODO #9100 */) {}
}

export function main() {
  describe('router bootstrap', () => {
    beforeEachProviders(
        () => [ROUTER_PROVIDERS, {provide: LocationStrategy, useClass: MockLocationStrategy}, {
          provide: ApplicationRef,
          useClass: MockApplicationRef
        }]);

    // do not refactor out the `bootstrap` functionality. We still want to
    // keep this test around so we can ensure that bootstrap a router works
    it('should bootstrap a simple app',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         var fakeDoc = getDOM().createHtmlDocument();
         var el = getDOM().createElement('app-cmp', fakeDoc);
         getDOM().appendChild(fakeDoc.body, el);

         bootstrap(AppCmp, [
           ROUTER_PROVIDERS, {provide: ROUTER_PRIMARY_COMPONENT, useValue: AppCmp},
           {provide: LocationStrategy, useClass: MockLocationStrategy},
           {provide: DOCUMENT, useValue: fakeDoc}, {provide: Console, useClass: DummyConsole}
         ]).then((applicationRef) => {
           var router = applicationRef.instance.router;
           router.subscribe((_: any /** TODO #9100 */) => {
             expect(el).toHaveText('outer { hello }');
             expect(applicationRef.instance.location.path()).toEqual('');
             async.done();
           });
         });
       }));

    describe('broken app', () => {
      beforeEachProviders(() => [{provide: ROUTER_PRIMARY_COMPONENT, useValue: BrokenAppCmp}]);

      it('should rethrow exceptions from component constructors',
         inject(
             [AsyncTestCompleter, TestComponentBuilder],
             (async: AsyncTestCompleter, tcb: TestComponentBuilder) => {
               tcb.createAsync(AppCmp).then((fixture) => {
                 var router = fixture.debugElement.componentInstance.router;
                 PromiseWrapper.catchError(router.navigateByUrl('/cause-error'), (error) => {
                   expect(error).toContainError('oops!');
                   async.done();
                 });
               });
             }));
    });

    describe('back button app', () => {
      beforeEachProviders(() => [{provide: ROUTER_PRIMARY_COMPONENT, useValue: HierarchyAppCmp}]);

      it('should change the url without pushing a new history state for back navigations',
         inject(
             [AsyncTestCompleter, TestComponentBuilder],
             (async: AsyncTestCompleter, tcb: TestComponentBuilder) => {

               tcb.createAsync(HierarchyAppCmp).then((fixture) => {
                 var router = fixture.debugElement.componentInstance.router;
                 var position = 0;
                 var flipped = false;
                 var history = [
                   ['/parent/child', 'root { parent { hello } }', '/super-parent/child'],
                   ['/super-parent/child', 'root { super-parent { hello2 } }', '/parent/child'],
                   ['/parent/child', 'root { parent { hello } }', false]
                 ];

                 router.subscribe((_: any /** TODO #9100 */) => {
                   var location = fixture.debugElement.componentInstance.location;
                   var element = fixture.debugElement.nativeElement;
                   var path = location.path();

                   var entry = history[position];

                   expect(path).toEqual(entry[0]);
                   expect(element).toHaveText(entry[1]);

                   var nextUrl = entry[2];
                   if (nextUrl == false) {
                     flipped = true;
                   }

                   if (flipped && position == 0) {
                     async.done();
                     return;
                   }

                   position = position + (flipped ? -1 : 1);
                   if (flipped) {
                     location.back();
                   } else {
                     router.navigateByUrl(nextUrl);
                   }
                 });

                 router.navigateByUrl(history[0][0]);
               });
             }),
         1000);
    });

    describe('hierarchical app', () => {
      beforeEachProviders(
          () => { return [{provide: ROUTER_PRIMARY_COMPONENT, useValue: HierarchyAppCmp}]; });

      it('should bootstrap an app with a hierarchy',
         inject(
             [AsyncTestCompleter, TestComponentBuilder],
             (async: AsyncTestCompleter, tcb: TestComponentBuilder) => {

               tcb.createAsync(HierarchyAppCmp).then((fixture) => {
                 var router = fixture.debugElement.componentInstance.router;
                 router.subscribe((_: any /** TODO #9100 */) => {
                   expect(fixture.debugElement.nativeElement)
                       .toHaveText('root { parent { hello } }');
                   expect(fixture.debugElement.componentInstance.location.path())
                       .toEqual('/parent/child');
                   async.done();
                 });
                 router.navigateByUrl('/parent/child');
               });
             }));

      // TODO(btford): mock out level lower than LocationStrategy once that level exists
      xdescribe('custom app base ref', () => {
        beforeEachProviders(() => { return [{provide: APP_BASE_HREF, useValue: '/my/app'}]; });
        it('should bootstrap',
           inject(
               [AsyncTestCompleter, TestComponentBuilder],
               (async: AsyncTestCompleter, tcb: TestComponentBuilder) => {

                 tcb.createAsync(HierarchyAppCmp).then((fixture) => {
                   var router = fixture.debugElement.componentInstance.router;
                   router.subscribe((_: any /** TODO #9100 */) => {
                     expect(fixture.debugElement.nativeElement)
                         .toHaveText('root { parent { hello } }');
                     expect(fixture.debugElement.componentInstance.location.path())
                         .toEqual('/my/app/parent/child');
                     async.done();
                   });
                   router.navigateByUrl('/parent/child');
                 });
               }));
      });
    });


    describe('querystring params app', () => {
      beforeEachProviders(
          () => { return [{provide: ROUTER_PRIMARY_COMPONENT, useValue: QueryStringAppCmp}]; });

      it('should recognize and return querystring params with the injected RouteParams',
         inject(
             [AsyncTestCompleter, TestComponentBuilder],
             (async: AsyncTestCompleter, tcb: TestComponentBuilder) => {
               tcb.createAsync(QueryStringAppCmp).then((fixture) => {
                 var router = fixture.debugElement.componentInstance.router;
                 router.subscribe((_: any /** TODO #9100 */) => {
                   fixture.detectChanges();

                   expect(fixture.debugElement.nativeElement)
                       .toHaveText('qParam = search-for-something');
                   /*
                   expect(applicationRef.hostComponent.location.path())
                       .toEqual('/qs?q=search-for-something');*/
                   async.done();
                 });
                 router.navigateByUrl('/qs?q=search-for-something');
                 fixture.detectChanges();
               });
             }));
    });

    describe('activate event on outlet', () => {
      let tcb: TestComponentBuilder = null;

      beforeEachProviders(() => [{provide: ROUTER_PRIMARY_COMPONENT, useValue: AppCmp}]);

      beforeEach(inject([TestComponentBuilder], (testComponentBuilder: any /** TODO #9100 */) => {
        tcb = testComponentBuilder;
      }));

      it('should get a reference and pass data to components loaded inside of outlets',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           tcb.createAsync(AppWithOutletListeners).then(fixture => {
             let appInstance = fixture.debugElement.componentInstance;
             let router = appInstance.router;

             router.subscribe((_: any /** TODO #9100 */) => {
               fixture.detectChanges();

               expect(appInstance.helloCmp).toBeAnInstanceOf(HelloCmp);
               expect(appInstance.helloCmp.message).toBe('Ahoy');

               async.done();
             });

             // TODO(juliemr): This isn't necessary for the test to pass - figure
             // out what's going on.
             // router.navigateByUrl('/rainbow(pony)');
           });
         }));
    });
  });
}


@Component({selector: 'hello-cmp', template: 'hello'})
class HelloCmp {
  public message: string;
}

@Component({selector: 'hello2-cmp', template: 'hello2'})
class Hello2Cmp {
  public greeting: string;
}

@Component({
  selector: 'app-cmp',
  template: `outer { <router-outlet></router-outlet> }`,
  directives: ROUTER_DIRECTIVES
})
@RouteConfig([new Route({path: '/', component: HelloCmp})])
class AppCmp {
  constructor(public router: Router, public location: LocationStrategy) {}
}

@Component({
  selector: 'app-cmp',
  template: `
    Hello routing!
    <router-outlet (activate)="activateHello($event)"></router-outlet>
    <router-outlet (activate)="activateHello2($event)" name="pony"></router-outlet>`,
  directives: ROUTER_DIRECTIVES
})
@RouteConfig([
  new Route({path: '/rainbow', component: HelloCmp}),
  new AuxRoute({name: 'pony', path: 'pony', component: Hello2Cmp})
])
class AppWithOutletListeners {
  helloCmp: HelloCmp;
  hello2Cmp: Hello2Cmp;

  constructor(public router: Router, public location: LocationStrategy) {}

  activateHello(cmp: HelloCmp) {
    this.helloCmp = cmp;
    this.helloCmp.message = 'Ahoy';
  }

  activateHello2(cmp: Hello2Cmp) { this.hello2Cmp = cmp; }
}

@Component({
  selector: 'parent-cmp',
  template: `parent { <router-outlet></router-outlet> }`,
  directives: ROUTER_DIRECTIVES
})
@RouteConfig([new Route({path: '/child', component: HelloCmp})])
class ParentCmp {
}

@Component({
  selector: 'super-parent-cmp',
  template: `super-parent { <router-outlet></router-outlet> }`,
  directives: ROUTER_DIRECTIVES
})
@RouteConfig([new Route({path: '/child', component: Hello2Cmp})])
class SuperParentCmp {
}

@Component({
  selector: 'app-cmp',
  template: `root { <router-outlet></router-outlet> }`,
  directives: ROUTER_DIRECTIVES
})
@RouteConfig([
  new Route({path: '/parent/...', component: ParentCmp}),
  new Route({path: '/super-parent/...', component: SuperParentCmp})
])
class HierarchyAppCmp {
  constructor(public router: Router, public location: LocationStrategy) {}
}

@Component({selector: 'qs-cmp', template: `qParam = {{q}}`})
class QSCmp {
  q: string;
  constructor(params: RouteParams) { this.q = params.get('q'); }
}

@Component({
  selector: 'app-cmp',
  template: `<router-outlet></router-outlet>`,
  directives: ROUTER_DIRECTIVES
})
@RouteConfig([new Route({path: '/qs', component: QSCmp})])
class QueryStringAppCmp {
  constructor(public router: Router, public location: LocationStrategy) {}
}

@Component({selector: 'oops-cmp', template: 'oh no'})
class BrokenCmp {
  constructor() { throw new BaseException('oops!'); }
}

@Component({
  selector: 'app-cmp',
  template: `outer { <router-outlet></router-outlet> }`,
  directives: ROUTER_DIRECTIVES
})
@RouteConfig([new Route({path: '/cause-error', component: BrokenCmp})])
class BrokenAppCmp {
  constructor(public router: Router, public location: LocationStrategy) {}
}
