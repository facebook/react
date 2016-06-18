import {Location} from '@angular/common';
import {ComponentFixture, TestComponentBuilder} from '@angular/compiler/testing';
import {Component, Inject, Injector, provide} from '@angular/core';
import {beforeEach, beforeEachProviders, ddescribe, describe, expect, iit, inject, it, xdescribe, xit} from '@angular/core/testing/testing_internal';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';
import {RouteData, RouteParams, Router, RouterLink, RouterOutlet} from '@angular/router-deprecated';

import {PromiseWrapper, TimerWrapper} from '../../src/facade/async';
import {AsyncRoute, AuxRoute, Redirect, Route, RouteConfig} from '../../src/route_config/route_config_decorator';

import {RootCmp, TEST_ROUTER_PROVIDERS, compile} from './util';

var cmpInstanceCount: any /** TODO #9100 */;
var childCmpInstanceCount: any /** TODO #9100 */;

export function main() {
  describe('navigation', () => {

    var tcb: TestComponentBuilder;
    var fixture: ComponentFixture<any>;
    var rtr: any /** TODO #9100 */;

    beforeEachProviders(() => TEST_ROUTER_PROVIDERS);

    beforeEach(inject(
        [TestComponentBuilder, Router],
        (tcBuilder: any /** TODO #9100 */, router: any /** TODO #9100 */) => {
          tcb = tcBuilder;
          rtr = router;
          childCmpInstanceCount = 0;
          cmpInstanceCount = 0;
        }));

    it('should work in a simple case', inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         compile(tcb)
             .then((rtc) => {fixture = rtc})
             .then((_) => rtr.config([new Route({path: '/test', component: HelloCmp})]))
             .then((_) => rtr.navigateByUrl('/test'))
             .then((_) => {
               fixture.detectChanges();
               expect(fixture.debugElement.nativeElement).toHaveText('hello');
               async.done();
             });
       }));


    it('should navigate between components with different parameters',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         compile(tcb)
             .then((rtc) => {fixture = rtc})
             .then((_) => rtr.config([new Route({path: '/user/:name', component: UserCmp})]))
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

    it('should navigate to child routes',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         compile(tcb, 'outer { <router-outlet></router-outlet> }')
             .then((rtc) => {fixture = rtc})
             .then((_) => rtr.config([new Route({path: '/a/...', component: ParentCmp})]))
             .then((_) => rtr.navigateByUrl('/a/b'))
             .then((_) => {
               fixture.detectChanges();
               expect(fixture.debugElement.nativeElement).toHaveText('outer { inner { hello } }');
               async.done();
             });
       }));

    it('should navigate to child routes that capture an empty path',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {

         compile(tcb, 'outer { <router-outlet></router-outlet> }')
             .then((rtc) => {fixture = rtc})
             .then((_) => rtr.config([new Route({path: '/a/...', component: ParentCmp})]))
             .then((_) => rtr.navigateByUrl('/a'))
             .then((_) => {
               fixture.detectChanges();
               expect(fixture.debugElement.nativeElement).toHaveText('outer { inner { hello } }');
               async.done();
             });
       }));

    it('should navigate to child routes when the root component has an empty path',
       inject(
           [AsyncTestCompleter, Location],
           (async: AsyncTestCompleter, location: any /** TODO #9100 */) => {
             compile(tcb, 'outer { <router-outlet></router-outlet> }')
                 .then((rtc) => {fixture = rtc})
                 .then((_) => rtr.config([new Route({path: '/...', component: ParentCmp})]))
                 .then((_) => rtr.navigateByUrl('/b'))
                 .then((_) => {
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement)
                       .toHaveText('outer { inner { hello } }');
                   expect(location.urlChanges).toEqual(['/b']);
                   async.done();
                 });
           }));

    it('should navigate to child routes of async routes',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         compile(tcb, 'outer { <router-outlet></router-outlet> }')
             .then((rtc) => {fixture = rtc})
             .then((_) => rtr.config([new AsyncRoute({path: '/a/...', loader: parentLoader})]))
             .then((_) => rtr.navigateByUrl('/a/b'))
             .then((_) => {
               fixture.detectChanges();
               expect(fixture.debugElement.nativeElement).toHaveText('outer { inner { hello } }');
               async.done();
             });
       }));


    it('should replace state when normalized paths are equal',
       inject(
           [AsyncTestCompleter, Location],
           (async: AsyncTestCompleter, location: any /** TODO #9100 */) => {
             compile(tcb)
                 .then((rtc) => {fixture = rtc})
                 .then((_) => location.setInitialPath('/test/'))
                 .then((_) => rtr.config([new Route({path: '/test', component: HelloCmp})]))
                 .then((_) => rtr.navigateByUrl('/test'))
                 .then((_) => {
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('hello');
                   expect(location.urlChanges).toEqual(['replace: /test']);
                   async.done();
                 });
           }));

    it('should reuse common parent components',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         compile(tcb)
             .then((rtc) => {fixture = rtc})
             .then((_) => rtr.config([new Route({path: '/team/:id/...', component: TeamCmp})]))
             .then((_) => rtr.navigateByUrl('/team/angular/user/rado'))
             .then((_) => {
               fixture.detectChanges();
               expect(cmpInstanceCount).toBe(1);
               expect(fixture.debugElement.nativeElement).toHaveText('team angular { hello rado }');
             })
             .then((_) => rtr.navigateByUrl('/team/angular/user/victor'))
             .then((_) => {
               fixture.detectChanges();
               expect(cmpInstanceCount).toBe(1);
               expect(fixture.debugElement.nativeElement)
                   .toHaveText('team angular { hello victor }');
               async.done();
             });
       }));

    it('should not reuse children when parent components change',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         compile(tcb)
             .then((rtc) => {fixture = rtc})
             .then((_) => rtr.config([new Route({path: '/team/:id/...', component: TeamCmp})]))
             .then((_) => rtr.navigateByUrl('/team/angular/user/rado'))
             .then((_) => {
               fixture.detectChanges();
               expect(cmpInstanceCount).toBe(1);
               expect(childCmpInstanceCount).toBe(1);
               expect(fixture.debugElement.nativeElement).toHaveText('team angular { hello rado }');
             })
             .then((_) => rtr.navigateByUrl('/team/dart/user/rado'))
             .then((_) => {
               fixture.detectChanges();
               expect(cmpInstanceCount).toBe(2);
               expect(childCmpInstanceCount).toBe(2);
               expect(fixture.debugElement.nativeElement).toHaveText('team dart { hello rado }');
               async.done();
             });
       }));

    it('should inject route data into component',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         compile(tcb)
             .then((rtc) => {fixture = rtc})
             .then((_) => rtr.config([new Route(
                       {path: '/route-data', component: RouteDataCmp, data: {isAdmin: true}})]))
             .then((_) => rtr.navigateByUrl('/route-data'))
             .then((_) => {
               fixture.detectChanges();
               expect(fixture.debugElement.nativeElement).toHaveText('true');
               async.done();
             });
       }));

    it('should inject route data into component with AsyncRoute',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         compile(tcb)
             .then((rtc) => {fixture = rtc})
             .then((_) => rtr.config([new AsyncRoute(
                       {path: '/route-data', loader: asyncRouteDataCmp, data: {isAdmin: true}})]))
             .then((_) => rtr.navigateByUrl('/route-data'))
             .then((_) => {
               fixture.detectChanges();
               expect(fixture.debugElement.nativeElement).toHaveText('true');
               async.done();
             });
       }));

    it('should inject empty object if the route has no data property',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         compile(tcb)
             .then((rtc) => {fixture = rtc})
             .then((_) => rtr.config([new Route(
                       {path: '/route-data-default', component: RouteDataCmp})]))
             .then((_) => rtr.navigateByUrl('/route-data-default'))
             .then((_) => {
               fixture.detectChanges();
               expect(fixture.debugElement.nativeElement).toHaveText('');
               async.done();
             });
       }));

    it('should fire an event for each activated component',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         compile(tcb, '<router-outlet (activate)="activatedCmp = $event"></router-outlet>')
             .then((rtc) => {fixture = rtc})
             .then((_) => rtr.config([new Route({path: '/test', component: HelloCmp})]))
             .then((_) => rtr.navigateByUrl('/test'))
             .then((_) => {
               // Note: need a timeout so that all promises are flushed
               var completer = PromiseWrapper.completer();
               TimerWrapper.setTimeout(() => { completer.resolve(null); }, 0);
               return completer.promise;
             })
             .then((_) => {
               expect(fixture.componentInstance.activatedCmp).toBeAnInstanceOf(HelloCmp);
               async.done();
             });
       }));
  });
}


@Component({selector: 'hello-cmp', template: `{{greeting}}`})
class HelloCmp {
  greeting: string;
  constructor() { this.greeting = 'hello'; }
}


function asyncRouteDataCmp() {
  return PromiseWrapper.resolve(RouteDataCmp);
}

@Component({selector: 'data-cmp', template: `{{myData}}`})
class RouteDataCmp {
  myData: boolean;
  constructor(data: RouteData) { this.myData = data.get('isAdmin'); }
}

@Component({selector: 'user-cmp', template: `hello {{user}}`})
class UserCmp {
  user: string;
  constructor(params: RouteParams) {
    childCmpInstanceCount += 1;
    this.user = params.get('name');
  }
}


function parentLoader() {
  return PromiseWrapper.resolve(ParentCmp);
}

@Component({
  selector: 'parent-cmp',
  template: `inner { <router-outlet></router-outlet> }`,
  directives: [RouterOutlet],
})
@RouteConfig([
  new Route({path: '/b', component: HelloCmp}),
  new Route({path: '/', component: HelloCmp}),
])
class ParentCmp {
}


@Component({
  selector: 'team-cmp',
  template: `team {{id}} { <router-outlet></router-outlet> }`,
  directives: [RouterOutlet],
})
@RouteConfig([new Route({path: '/user/:name', component: UserCmp})])
class TeamCmp {
  id: string;
  constructor(params: RouteParams) {
    this.id = params.get('id');
    cmpInstanceCount += 1;
  }
}
