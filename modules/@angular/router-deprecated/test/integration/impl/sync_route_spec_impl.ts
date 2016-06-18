import {beforeEach, beforeEachProviders, expect, iit, inject, it, xit,} from '@angular/core/testing/testing_internal';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';
import {TestComponentBuilder, ComponentFixture} from '@angular/compiler/testing';

import {specs, compile, TEST_ROUTER_PROVIDERS, clickOnElement, getHref} from '../util';
import {Location} from '@angular/common';
import {Router, Route} from '@angular/router-deprecated';
import {HelloCmp, UserCmp, TeamCmp, ParentCmp, ParentWithDefaultCmp, DynamicLoaderCmp} from './fixture_components';
import {PromiseWrapper} from '../../../src/facade/async';
import {By} from '@angular/platform-browser/src/dom/debug/by';


function getLinkElement(rtc: ComponentFixture<any>) {
  return rtc.debugElement.query(By.css('a')).nativeElement;
}

function syncRoutesWithoutChildrenWithoutParams() {
  var fixture: any /** TODO #9100 */;
  var tcb: any /** TODO #9100 */;
  var rtr: any /** TODO #9100 */;

  beforeEachProviders(() => TEST_ROUTER_PROVIDERS);

  beforeEach(inject(
      [TestComponentBuilder, Router],
      (tcBuilder: any /** TODO #9100 */, router: any /** TODO #9100 */) => {
        tcb = tcBuilder;
        rtr = router;
      }));

  it('should navigate by URL', inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
       compile(tcb)
           .then((rtc) => {fixture = rtc})
           .then(
               (_) => rtr.config([new Route({path: '/test', component: HelloCmp, name: 'Hello'})]))
           .then((_) => rtr.navigateByUrl('/test'))
           .then((_) => {
             fixture.detectChanges();
             expect(fixture.debugElement.nativeElement).toHaveText('hello');
             async.done();
           });
     }));

  it('should navigate by link DSL', inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
       compile(tcb)
           .then((rtc) => {fixture = rtc})
           .then(
               (_) => rtr.config([new Route({path: '/test', component: HelloCmp, name: 'Hello'})]))
           .then((_) => rtr.navigate(['/Hello']))
           .then((_) => {
             fixture.detectChanges();
             expect(fixture.debugElement.nativeElement).toHaveText('hello');
             async.done();
           });
     }));

  it('should generate a link URL', inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
       compile(tcb, `<a [routerLink]="['Hello']">go to hello</a> | <router-outlet></router-outlet>`)
           .then((rtc) => {fixture = rtc})
           .then(
               (_) => rtr.config([new Route({path: '/test', component: HelloCmp, name: 'Hello'})]))
           .then((_) => {
             fixture.detectChanges();
             expect(getHref(getLinkElement(fixture))).toEqual('/test');
             async.done();
           });
     }));

  it('should navigate from a link click',
     inject(
         [AsyncTestCompleter, Location],
         (async: AsyncTestCompleter, location: any /** TODO #9100 */) => {
           compile(
               tcb, `<a [routerLink]="['Hello']">go to hello</a> | <router-outlet></router-outlet>`)
               .then((rtc) => {fixture = rtc})
               .then(
                   (_) =>
                       rtr.config([new Route({path: '/test', component: HelloCmp, name: 'Hello'})]))
               .then((_) => {
                 fixture.detectChanges();
                 expect(fixture.debugElement.nativeElement).toHaveText('go to hello | ');

                 rtr.subscribe((_: any /** TODO #9100 */) => {
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('go to hello | hello');
                   expect(location.urlChanges).toEqual(['/test']);
                   async.done();
                 });

                 clickOnElement(getLinkElement(fixture));
               });
         }));
}


function syncRoutesWithoutChildrenWithParams() {
  var fixture: any /** TODO #9100 */;
  var tcb: any /** TODO #9100 */;
  var rtr: any /** TODO #9100 */;

  beforeEachProviders(() => TEST_ROUTER_PROVIDERS);

  beforeEach(inject(
      [TestComponentBuilder, Router],
      (tcBuilder: any /** TODO #9100 */, router: any /** TODO #9100 */) => {
        tcb = tcBuilder;
        rtr = router;
      }));

  it('should navigate by URL', inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
       compile(tcb)
           .then((rtc) => {fixture = rtc})
           .then(
               (_) =>
                   rtr.config([new Route({path: '/user/:name', component: UserCmp, name: 'User'})]))
           .then((_) => rtr.navigateByUrl('/user/igor'))
           .then((_) => {
             fixture.detectChanges();
             expect(fixture.debugElement.nativeElement).toHaveText('hello igor');
             async.done();
           });
     }));

  it('should navigate by link DSL', inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
       compile(tcb)
           .then((rtc) => {fixture = rtc})
           .then(
               (_) =>
                   rtr.config([new Route({path: '/user/:name', component: UserCmp, name: 'User'})]))
           .then((_) => rtr.navigate(['/User', {name: 'brian'}]))
           .then((_) => {
             fixture.detectChanges();
             expect(fixture.debugElement.nativeElement).toHaveText('hello brian');
             async.done();
           });
     }));

  it('should generate a link URL', inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
       compile(
           tcb,
           `<a [routerLink]="['User', {name: 'naomi'}]">greet naomi</a> | <router-outlet></router-outlet>`)
           .then((rtc) => {fixture = rtc})
           .then(
               (_) =>
                   rtr.config([new Route({path: '/user/:name', component: UserCmp, name: 'User'})]))
           .then((_) => {
             fixture.detectChanges();
             expect(getHref(getLinkElement(fixture))).toEqual('/user/naomi');
             async.done();
           });
     }));

  it('should navigate from a link click',
     inject(
         [AsyncTestCompleter, Location],
         (async: AsyncTestCompleter, location: any /** TODO #9100 */) => {
           compile(
               tcb,
               `<a [routerLink]="['User', {name: 'naomi'}]">greet naomi</a> | <router-outlet></router-outlet>`)
               .then((rtc) => {fixture = rtc})
               .then((_) => rtr.config([new Route(
                         {path: '/user/:name', component: UserCmp, name: 'User'})]))
               .then((_) => {
                 fixture.detectChanges();
                 expect(fixture.debugElement.nativeElement).toHaveText('greet naomi | ');

                 rtr.subscribe((_: any /** TODO #9100 */) => {
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement)
                       .toHaveText('greet naomi | hello naomi');
                   expect(location.urlChanges).toEqual(['/user/naomi']);
                   async.done();
                 });

                 clickOnElement(getLinkElement(fixture));
               });
         }));

  it('should navigate between components with different parameters',
     inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
       compile(tcb)
           .then((rtc) => {fixture = rtc})
           .then(
               (_) =>
                   rtr.config([new Route({path: '/user/:name', component: UserCmp, name: 'User'})]))
           .then((_) => rtr.navigateByUrl('/user/brian'))
           .then((_) => {
             fixture.detectChanges();
             expect(fixture.debugElement.nativeElement).toHaveText('hello brian');
           })
           .then((_) => rtr.navigateByUrl('/user/igor'))
           .then((_) => {
             fixture.detectChanges();
             expect(fixture.debugElement.nativeElement).toHaveText('hello igor');
             async.done();
           });
     }));
}


function syncRoutesWithSyncChildrenWithoutDefaultRoutesWithoutParams() {
  var fixture: any /** TODO #9100 */;
  var tcb: any /** TODO #9100 */;
  var rtr: any /** TODO #9100 */;

  beforeEachProviders(() => TEST_ROUTER_PROVIDERS);

  beforeEach(inject(
      [TestComponentBuilder, Router],
      (tcBuilder: any /** TODO #9100 */, router: any /** TODO #9100 */) => {
        tcb = tcBuilder;
        rtr = router;
      }));

  it('should navigate by URL', inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
       compile(tcb, `outer { <router-outlet></router-outlet> }`)
           .then((rtc) => {fixture = rtc})
           .then(
               (_) =>
                   rtr.config([new Route({path: '/a/...', component: ParentCmp, name: 'Parent'})]))
           .then((_) => rtr.navigateByUrl('/a/b'))
           .then((_) => {
             fixture.detectChanges();
             expect(fixture.debugElement.nativeElement).toHaveText('outer { inner { hello } }');
             async.done();
           });
     }));

  it('should navigate by link DSL', inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
       compile(tcb, `outer { <router-outlet></router-outlet> }`)
           .then((rtc) => {fixture = rtc})
           .then(
               (_) =>
                   rtr.config([new Route({path: '/a/...', component: ParentCmp, name: 'Parent'})]))
           .then((_) => rtr.navigate(['/Parent', 'Child']))
           .then((_) => {
             fixture.detectChanges();
             expect(fixture.debugElement.nativeElement).toHaveText('outer { inner { hello } }');
             async.done();
           });
     }));

  it('should generate a link URL', inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
       compile(
           tcb,
           `<a [routerLink]="['Parent', 'Child']">nav to child</a> | outer { <router-outlet></router-outlet> }`)
           .then((rtc) => {fixture = rtc})
           .then(
               (_) =>
                   rtr.config([new Route({path: '/a/...', component: ParentCmp, name: 'Parent'})]))
           .then((_) => {
             fixture.detectChanges();
             expect(getHref(getLinkElement(fixture))).toEqual('/a/b');
             async.done();
           });
     }));

  it('should navigate from a link click',
     inject(
         [AsyncTestCompleter, Location],
         (async: AsyncTestCompleter, location: any /** TODO #9100 */) => {
           compile(
               tcb,
               `<a [routerLink]="['Parent', 'Child']">nav to child</a> | outer { <router-outlet></router-outlet> }`)
               .then((rtc) => {fixture = rtc})
               .then((_) => rtr.config([new Route(
                         {path: '/a/...', component: ParentCmp, name: 'Parent'})]))
               .then((_) => {
                 fixture.detectChanges();
                 expect(fixture.debugElement.nativeElement).toHaveText('nav to child | outer {  }');

                 rtr.subscribe((_: any /** TODO #9100 */) => {
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement)
                       .toHaveText('nav to child | outer { inner { hello } }');
                   expect(location.urlChanges).toEqual(['/a/b']);
                   async.done();
                 });

                 clickOnElement(getLinkElement(fixture));
               });
         }));
}


function syncRoutesWithSyncChildrenWithoutDefaultRoutesWithParams() {
  var fixture: any /** TODO #9100 */;
  var tcb: any /** TODO #9100 */;
  var rtr: any /** TODO #9100 */;

  beforeEachProviders(() => TEST_ROUTER_PROVIDERS);

  beforeEach(inject(
      [TestComponentBuilder, Router],
      (tcBuilder: any /** TODO #9100 */, router: any /** TODO #9100 */) => {
        tcb = tcBuilder;
        rtr = router;
      }));

  it('should navigate by URL', inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
       compile(tcb, `{ <router-outlet></router-outlet> }`)
           .then((rtc) => {fixture = rtc})
           .then((_) => rtr.config([new Route(
                     {path: '/team/:id/...', component: TeamCmp, name: 'Team'})]))
           .then((_) => rtr.navigateByUrl('/team/angular/user/matias'))
           .then((_) => {
             fixture.detectChanges();
             expect(fixture.debugElement.nativeElement)
                 .toHaveText('{ team angular | user { hello matias } }');
             async.done();
           });
     }));

  it('should navigate by link DSL', inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
       compile(tcb, `{ <router-outlet></router-outlet> }`)
           .then((rtc) => {fixture = rtc})
           .then((_) => rtr.config([new Route(
                     {path: '/team/:id/...', component: TeamCmp, name: 'Team'})]))
           .then((_) => rtr.navigate(['/Team', {id: 'angular'}, 'User', {name: 'matias'}]))
           .then((_) => {
             fixture.detectChanges();
             expect(fixture.debugElement.nativeElement)
                 .toHaveText('{ team angular | user { hello matias } }');
             async.done();
           });
     }));

  it('should generate a link URL', inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
       compile(
           tcb,
           `<a [routerLink]="['/Team', {id: 'angular'}, 'User', {name: 'matias'}]">nav to matias</a> { <router-outlet></router-outlet> }`)
           .then((rtc) => {fixture = rtc})
           .then((_) => rtr.config([new Route(
                     {path: '/team/:id/...', component: TeamCmp, name: 'Team'})]))
           .then((_) => {
             fixture.detectChanges();
             expect(getHref(getLinkElement(fixture))).toEqual('/team/angular/user/matias');
             async.done();
           });
     }));

  it('should navigate from a link click',
     inject(
         [AsyncTestCompleter, Location],
         (async: AsyncTestCompleter, location: any /** TODO #9100 */) => {
           compile(
               tcb,
               `<a [routerLink]="['/Team', {id: 'angular'}, 'User', {name: 'matias'}]">nav to matias</a> { <router-outlet></router-outlet> }`)
               .then((rtc) => {fixture = rtc})
               .then((_) => rtr.config([new Route(
                         {path: '/team/:id/...', component: TeamCmp, name: 'Team'})]))
               .then((_) => {
                 fixture.detectChanges();
                 expect(fixture.debugElement.nativeElement).toHaveText('nav to matias {  }');

                 rtr.subscribe((_: any /** TODO #9100 */) => {
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement)
                       .toHaveText('nav to matias { team angular | user { hello matias } }');
                   expect(location.urlChanges).toEqual(['/team/angular/user/matias']);
                   async.done();
                 });

                 clickOnElement(getLinkElement(fixture));
               });
         }));
}


function syncRoutesWithSyncChildrenWithDefaultRoutesWithoutParams() {
  var fixture: any /** TODO #9100 */;
  var tcb: any /** TODO #9100 */;
  var rtr: any /** TODO #9100 */;

  beforeEachProviders(() => TEST_ROUTER_PROVIDERS);

  beforeEach(inject(
      [TestComponentBuilder, Router],
      (tcBuilder: any /** TODO #9100 */, router: any /** TODO #9100 */) => {
        tcb = tcBuilder;
        rtr = router;
      }));

  it('should navigate by URL', inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
       compile(tcb, `outer { <router-outlet></router-outlet> }`)
           .then((rtc) => {fixture = rtc})
           .then((_) => rtr.config([new Route(
                     {path: '/a/...', component: ParentWithDefaultCmp, name: 'Parent'})]))
           .then((_) => rtr.navigateByUrl('/a'))
           .then((_) => {
             fixture.detectChanges();
             expect(fixture.debugElement.nativeElement).toHaveText('outer { inner { hello } }');
             async.done();
           });
     }));

  it('should navigate by link DSL', inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
       compile(tcb, `outer { <router-outlet></router-outlet> }`)
           .then((rtc) => {fixture = rtc})
           .then((_) => rtr.config([new Route(
                     {path: '/a/...', component: ParentWithDefaultCmp, name: 'Parent'})]))
           .then((_) => rtr.navigate(['/Parent']))
           .then((_) => {
             fixture.detectChanges();
             expect(fixture.debugElement.nativeElement).toHaveText('outer { inner { hello } }');
             async.done();
           });
     }));

  it('should generate a link URL', inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
       compile(
           tcb,
           `<a [routerLink]="['/Parent']">link to inner</a> | outer { <router-outlet></router-outlet> }`)
           .then((rtc) => {fixture = rtc})
           .then((_) => rtr.config([new Route(
                     {path: '/a/...', component: ParentWithDefaultCmp, name: 'Parent'})]))
           .then((_) => {
             fixture.detectChanges();
             expect(getHref(getLinkElement(fixture))).toEqual('/a');
             async.done();
           });
     }));

  it('should navigate from a link click',
     inject(
         [AsyncTestCompleter, Location],
         (async: AsyncTestCompleter, location: any /** TODO #9100 */) => {
           compile(
               tcb,
               `<a [routerLink]="['/Parent']">link to inner</a> | outer { <router-outlet></router-outlet> }`)
               .then((rtc) => {fixture = rtc})
               .then((_) => rtr.config([new Route(
                         {path: '/a/...', component: ParentWithDefaultCmp, name: 'Parent'})]))
               .then((_) => {
                 fixture.detectChanges();
                 expect(fixture.debugElement.nativeElement)
                     .toHaveText('link to inner | outer {  }');

                 rtr.subscribe((_: any /** TODO #9100 */) => {
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement)
                       .toHaveText('link to inner | outer { inner { hello } }');
                   expect(location.urlChanges).toEqual(['/a/b']);
                   async.done();
                 });

                 clickOnElement(getLinkElement(fixture));
               });
         }));
}

function syncRoutesWithDynamicComponents() {
  var fixture: ComponentFixture<any>;
  var tcb: TestComponentBuilder;
  var rtr: Router;

  beforeEachProviders(() => TEST_ROUTER_PROVIDERS);

  beforeEach(inject(
      [TestComponentBuilder, Router],
      (tcBuilder: any /** TODO #9100 */, router: any /** TODO #9100 */) => {
        tcb = tcBuilder;
        rtr = router;
      }));


  it('should work',
     inject(
         [AsyncTestCompleter],
         (async: AsyncTestCompleter) => {
             tcb.createAsync(DynamicLoaderCmp)
                 .then((rtc) => {fixture = rtc})
                 .then((_) => rtr.config([new Route({path: '/', component: HelloCmp})]))
                 .then((_) => {
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('{  }');
                   return fixture.componentInstance.onSomeAction();
                 })
                 .then((_) => {
                   fixture.detectChanges();
                   return rtr.navigateByUrl('/');
                 })
                 .then((_) => {
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('{ hello }');

                   return fixture.componentInstance.onSomeAction();
                 })
                 .then((_) => {

                   // TODO(i): This should be rewritten to use NgZone#onStable or
                   // something
                   // similar basically the assertion needs to run when the world is
                   // stable and we don't know when that is, only zones know.
                   PromiseWrapper.resolve(null).then((_) => {
                     fixture.detectChanges();
                     expect(fixture.debugElement.nativeElement).toHaveText('{ hello }');
                     async.done();
                   });
                 })}));
}



export function registerSpecs() {
  (specs as any /** TODO #9100 */)['syncRoutesWithoutChildrenWithoutParams'] =
      syncRoutesWithoutChildrenWithoutParams;
  (specs as any /** TODO #9100 */)['syncRoutesWithoutChildrenWithParams'] =
      syncRoutesWithoutChildrenWithParams;
  (specs as any /** TODO #9100 */)['syncRoutesWithSyncChildrenWithoutDefaultRoutesWithoutParams'] =
      syncRoutesWithSyncChildrenWithoutDefaultRoutesWithoutParams;
  (specs as any /** TODO #9100 */)['syncRoutesWithSyncChildrenWithoutDefaultRoutesWithParams'] =
      syncRoutesWithSyncChildrenWithoutDefaultRoutesWithParams;
  (specs as any /** TODO #9100 */)['syncRoutesWithSyncChildrenWithDefaultRoutesWithoutParams'] =
      syncRoutesWithSyncChildrenWithDefaultRoutesWithoutParams;
  (specs as any /** TODO #9100 */)['syncRoutesWithDynamicComponents'] =
      syncRoutesWithDynamicComponents;
}
