import {Location} from '@angular/common';
import {ComponentFixture, TestComponentBuilder} from '@angular/compiler/testing';
import {Component} from '@angular/core';
import {beforeEach, beforeEachProviders, ddescribe, describe, expect, iit, inject, it, xdescribe, xit} from '@angular/core/testing/testing_internal';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';
import {By} from '@angular/platform-browser/src/dom/debug/by';
import {AuxRoute, ROUTER_DIRECTIVES, Route, RouteConfig, Router} from '@angular/router-deprecated';

import {BaseException} from '../../../src/facade/exceptions';
import {clickOnElement, compile, getHref, specs} from '../util';

function getLinkElement(rtc: ComponentFixture<any>, linkIndex: number = 0) {
  return rtc.debugElement.queryAll(By.css('a'))[linkIndex].nativeElement;
}

function auxRoutes() {
  var tcb: TestComponentBuilder;
  var fixture: ComponentFixture<any>;
  var rtr: any /** TODO #9100 */;

  beforeEach(inject(
      [TestComponentBuilder, Router],
      (tcBuilder: any /** TODO #9100 */, router: any /** TODO #9100 */) => {
        tcb = tcBuilder;
        rtr = router;
      }));

  it('should recognize and navigate from the URL',
     inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
       compile(
           tcb,
           `main {<router-outlet></router-outlet>} | aux {<router-outlet name="modal"></router-outlet>}`)
           .then((rtc) => {fixture = rtc})
           .then((_) => rtr.config([
             new Route({path: '/hello', component: HelloCmp, name: 'Hello'}),
             new AuxRoute({path: '/modal', component: ModalCmp, name: 'Aux'})
           ]))
           .then((_) => rtr.navigateByUrl('/(modal)'))
           .then((_) => {
             fixture.detectChanges();
             expect(fixture.debugElement.nativeElement).toHaveText('main {} | aux {modal}');
             async.done();
           });
     }));

  it('should navigate via the link DSL',
     inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
       compile(
           tcb,
           `main {<router-outlet></router-outlet>} | aux {<router-outlet name="modal"></router-outlet>}`)
           .then((rtc) => {fixture = rtc})
           .then((_) => rtr.config([
             new Route({path: '/hello', component: HelloCmp, name: 'Hello'}),
             new AuxRoute({path: '/modal', component: ModalCmp, name: 'Modal'})
           ]))
           .then((_) => rtr.navigate(['/', ['Modal']]))
           .then((_) => {
             fixture.detectChanges();
             expect(fixture.debugElement.nativeElement).toHaveText('main {} | aux {modal}');
             async.done();
           });
     }));

  it('should generate a link URL', inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
       compile(
           tcb,
           `<a [routerLink]="['/', ['Modal']]">open modal</a> | main {<router-outlet></router-outlet>} | aux {<router-outlet name="modal"></router-outlet>}`)
           .then((rtc) => {fixture = rtc})
           .then((_) => rtr.config([
             new Route({path: '/hello', component: HelloCmp, name: 'Hello'}),
             new AuxRoute({path: '/modal', component: ModalCmp, name: 'Modal'})
           ]))
           .then((_) => {
             fixture.detectChanges();
             expect(getHref(getLinkElement(fixture))).toEqual('/(modal)');
             async.done();
           });
     }));

  it('should navigate from a link click',
     inject(
         [AsyncTestCompleter, Location],
         (async: AsyncTestCompleter, location: any /** TODO #9100 */) => {
           compile(
               tcb,
               `<a [routerLink]="['/', ['Modal']]">open modal</a> | <a [routerLink]="['/Hello']">hello</a> | main {<router-outlet></router-outlet>} | aux {<router-outlet name="modal"></router-outlet>}`)
               .then((rtc) => {fixture = rtc})
               .then((_) => rtr.config([
                 new Route({path: '/hello', component: HelloCmp, name: 'Hello'}),
                 new AuxRoute({path: '/modal', component: ModalCmp, name: 'Modal'})
               ]))
               .then((_) => {
                 fixture.detectChanges();
                 expect(fixture.debugElement.nativeElement)
                     .toHaveText('open modal | hello | main {} | aux {}');

                 var navCount = 0;

                 rtr.subscribe((_: any /** TODO #9100 */) => {
                   navCount += 1;
                   fixture.detectChanges();
                   if (navCount == 1) {
                     expect(fixture.debugElement.nativeElement)
                         .toHaveText('open modal | hello | main {} | aux {modal}');
                     expect(location.urlChanges).toEqual(['/(modal)']);
                     expect(getHref(getLinkElement(fixture, 0))).toEqual('/(modal)');
                     expect(getHref(getLinkElement(fixture, 1))).toEqual('/hello(modal)');

                     // click on primary route link
                     clickOnElement(getLinkElement(fixture, 1));
                   } else if (navCount == 2) {
                     expect(fixture.debugElement.nativeElement)
                         .toHaveText('open modal | hello | main {hello} | aux {modal}');
                     expect(location.urlChanges).toEqual(['/(modal)', '/hello(modal)']);
                     expect(getHref(getLinkElement(fixture, 0))).toEqual('/hello(modal)');
                     expect(getHref(getLinkElement(fixture, 1))).toEqual('/hello(modal)');
                     async.done();
                   } else {
                     throw new BaseException(`Unexpected route change #${navCount}`);
                   }
                 });

                 clickOnElement(getLinkElement(fixture));
               });
         }));
}


function auxRoutesWithAPrimaryRoute() {
  var tcb: TestComponentBuilder;
  var fixture: ComponentFixture<any>;
  var rtr: any /** TODO #9100 */;

  beforeEach(inject(
      [TestComponentBuilder, Router],
      (tcBuilder: any /** TODO #9100 */, router: any /** TODO #9100 */) => {
        tcb = tcBuilder;
        rtr = router;
      }));

  it('should recognize and navigate from the URL',
     inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
       compile(
           tcb,
           `main {<router-outlet></router-outlet>} | aux {<router-outlet name="modal"></router-outlet>}`)
           .then((rtc) => {fixture = rtc})
           .then((_) => rtr.config([
             new Route({path: '/hello', component: HelloCmp, name: 'Hello'}),
             new AuxRoute({path: '/modal', component: ModalCmp, name: 'Aux'})
           ]))
           .then((_) => rtr.navigateByUrl('/hello(modal)'))
           .then((_) => {
             fixture.detectChanges();
             expect(fixture.debugElement.nativeElement).toHaveText('main {hello} | aux {modal}');
             async.done();
           });
     }));

  it('should navigate via the link DSL',
     inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
       compile(
           tcb,
           `main {<router-outlet></router-outlet>} | aux {<router-outlet name="modal"></router-outlet>}`)
           .then((rtc) => {fixture = rtc})
           .then((_) => rtr.config([
             new Route({path: '/hello', component: HelloCmp, name: 'Hello'}),
             new AuxRoute({path: '/modal', component: ModalCmp, name: 'Modal'})
           ]))
           .then((_) => rtr.navigate(['/Hello', ['Modal']]))
           .then((_) => {
             fixture.detectChanges();
             expect(fixture.debugElement.nativeElement).toHaveText('main {hello} | aux {modal}');
             async.done();
           });
     }));

  it('should generate a link URL', inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
       compile(
           tcb,
           `<a [routerLink]="['/Hello', ['Modal']]">open modal</a> | main {<router-outlet></router-outlet>} | aux {<router-outlet name="modal"></router-outlet>}`)
           .then((rtc) => {fixture = rtc})
           .then((_) => rtr.config([
             new Route({path: '/hello', component: HelloCmp, name: 'Hello'}),
             new AuxRoute({path: '/modal', component: ModalCmp, name: 'Modal'})
           ]))
           .then((_) => {
             fixture.detectChanges();
             expect(getHref(getLinkElement(fixture))).toEqual('/hello(modal)');
             async.done();
           });
     }));

  it('should navigate from a link click',
     inject(
         [AsyncTestCompleter, Location],
         (async: AsyncTestCompleter, location: any /** TODO #9100 */) => {
           compile(
               tcb,
               `<a [routerLink]="['/Hello', ['Modal']]">open modal</a> | main {<router-outlet></router-outlet>} | aux {<router-outlet name="modal"></router-outlet>}`)
               .then((rtc) => {fixture = rtc})
               .then((_) => rtr.config([
                 new Route({path: '/hello', component: HelloCmp, name: 'Hello'}),
                 new AuxRoute({path: '/modal', component: ModalCmp, name: 'Modal'})
               ]))
               .then((_) => {
                 fixture.detectChanges();
                 expect(fixture.debugElement.nativeElement)
                     .toHaveText('open modal | main {} | aux {}');

                 rtr.subscribe((_: any /** TODO #9100 */) => {
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement)
                       .toHaveText('open modal | main {hello} | aux {modal}');
                   expect(location.urlChanges).toEqual(['/hello(modal)']);
                   async.done();
                 });

                 clickOnElement(getLinkElement(fixture));
               });
         }));
}

export function registerSpecs() {
  (specs as any /** TODO #9100 */)['auxRoutes'] = auxRoutes;
  (specs as any /** TODO #9100 */)['auxRoutesWithAPrimaryRoute'] = auxRoutesWithAPrimaryRoute;
}


@Component({selector: 'hello-cmp', template: `{{greeting}}`})
class HelloCmp {
  greeting: string;
  constructor() { this.greeting = 'hello'; }
}

@Component({selector: 'modal-cmp', template: `modal`})
class ModalCmp {
}

@Component({
  selector: 'aux-cmp',
  template: 'main {<router-outlet></router-outlet>} | ' +
      'aux {<router-outlet name="modal"></router-outlet>}',
  directives: [ROUTER_DIRECTIVES],
})
@RouteConfig([
  new Route({path: '/hello', component: HelloCmp, name: 'Hello'}),
  new AuxRoute({path: '/modal', component: ModalCmp, name: 'Aux'})
])
class AuxCmp {
}
