import {ComponentFixture, TestComponentBuilder} from '@angular/compiler/testing';
import {Component, Inject, Injector, provide} from '@angular/core';
import {beforeEach, beforeEachProviders, ddescribe, describe, expect, iit, inject, it, xdescribe, xit} from '@angular/core/testing/testing_internal';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';
import {RouteParams, Router, RouterLink, RouterOutlet} from '@angular/router-deprecated';

import {EventEmitter, ObservableWrapper, PromiseCompleter, PromiseWrapper} from '../../src/facade/async';
import {isPresent} from '../../src/facade/lang';
import {ComponentInstruction} from '../../src/instruction';
import {CanDeactivate, CanReuse, OnActivate, OnDeactivate, OnReuse} from '../../src/interfaces';
import {CanActivate} from '../../src/lifecycle/lifecycle_annotations';
import {AsyncRoute, AuxRoute, Redirect, Route, RouteConfig} from '../../src/route_config/route_config_decorator';

import {RootCmp, TEST_ROUTER_PROVIDERS, compile} from './util';

var cmpInstanceCount: any /** TODO #9100 */;
var log: string[];
var eventBus: EventEmitter<any>;
var completer: PromiseCompleter<any>;

export function main() {
  describe('Router lifecycle hooks', () => {

    var tcb: TestComponentBuilder;
    var fixture: ComponentFixture<any>;
    var rtr: Router;

    beforeEachProviders(() => TEST_ROUTER_PROVIDERS);

    beforeEach(inject(
        [TestComponentBuilder, Router], (tcBuilder: TestComponentBuilder, router: Router) => {
          tcb = tcBuilder;
          rtr = router;
          cmpInstanceCount = 0;
          log = [];
          eventBus = new EventEmitter();
        }));

    it('should call the routerOnActivate hook',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         compile(tcb)
             .then((rtc) => {fixture = rtc})
             .then((_) => rtr.config([new Route({path: '/...', component: LifecycleCmp})]))
             .then((_) => rtr.navigateByUrl('/on-activate'))
             .then((_) => {
               fixture.detectChanges();
               expect(fixture.debugElement.nativeElement).toHaveText('activate cmp');
               expect(log).toEqual(['activate: null -> /on-activate']);
               async.done();
             });
       }));

    it('should wait for a parent component\'s routerOnActivate hook to resolve before calling its child\'s',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         compile(tcb)
             .then((rtc) => {fixture = rtc})
             .then((_) => rtr.config([new Route({path: '/...', component: LifecycleCmp})]))
             .then((_) => {
               ObservableWrapper.subscribe<string>(eventBus, (ev) => {
                 if (ev.startsWith('parent activate')) {
                   completer.resolve(true);
                 }
               });
               rtr.navigateByUrl('/parent-activate/child-activate').then((_) => {
                 fixture.detectChanges();
                 expect(fixture.debugElement.nativeElement).toHaveText('parent {activate cmp}');
                 expect(log).toEqual([
                   'parent activate: null -> /parent-activate', 'activate: null -> /child-activate'
                 ]);
                 async.done();
               });
             });
       }));

    it('should call the routerOnDeactivate hook',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         compile(tcb)
             .then((rtc) => {fixture = rtc})
             .then((_) => rtr.config([new Route({path: '/...', component: LifecycleCmp})]))
             .then((_) => rtr.navigateByUrl('/on-deactivate'))
             .then((_) => rtr.navigateByUrl('/a'))
             .then((_) => {
               fixture.detectChanges();
               expect(fixture.debugElement.nativeElement).toHaveText('A');
               expect(log).toEqual(['deactivate: /on-deactivate -> /a']);
               async.done();
             });
       }));

    it('should wait for a child component\'s routerOnDeactivate hook to resolve before calling its parent\'s',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         compile(tcb)
             .then((rtc) => {fixture = rtc})
             .then((_) => rtr.config([new Route({path: '/...', component: LifecycleCmp})]))
             .then((_) => rtr.navigateByUrl('/parent-deactivate/child-deactivate'))
             .then((_) => {
               ObservableWrapper.subscribe<string>(eventBus, (ev) => {
                 if (ev.startsWith('deactivate')) {
                   completer.resolve(true);
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('parent {deactivate cmp}');
                 }
               });
               rtr.navigateByUrl('/a').then((_) => {
                 fixture.detectChanges();
                 expect(fixture.debugElement.nativeElement).toHaveText('A');
                 expect(log).toEqual([
                   'deactivate: /child-deactivate -> null',
                   'parent deactivate: /parent-deactivate -> /a'
                 ]);
                 async.done();
               });
             });
       }));

    it('should reuse a component when the routerCanReuse hook returns true',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         compile(tcb)
             .then((rtc) => {fixture = rtc})
             .then((_) => rtr.config([new Route({path: '/...', component: LifecycleCmp})]))
             .then((_) => rtr.navigateByUrl('/on-reuse/1/a'))
             .then((_) => {
               fixture.detectChanges();
               expect(log).toEqual([]);
               expect(fixture.debugElement.nativeElement).toHaveText('reuse {A}');
               expect(cmpInstanceCount).toBe(1);
             })
             .then((_) => rtr.navigateByUrl('/on-reuse/2/b'))
             .then((_) => {
               fixture.detectChanges();
               expect(log).toEqual(['reuse: /on-reuse/1 -> /on-reuse/2']);
               expect(fixture.debugElement.nativeElement).toHaveText('reuse {B}');
               expect(cmpInstanceCount).toBe(1);
               async.done();
             });
       }));


    it('should not reuse a component when the routerCanReuse hook returns false',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         compile(tcb)
             .then((rtc) => {fixture = rtc})
             .then((_) => rtr.config([new Route({path: '/...', component: LifecycleCmp})]))
             .then((_) => rtr.navigateByUrl('/never-reuse/1/a'))
             .then((_) => {
               fixture.detectChanges();
               expect(log).toEqual([]);
               expect(fixture.debugElement.nativeElement).toHaveText('reuse {A}');
               expect(cmpInstanceCount).toBe(1);
             })
             .then((_) => rtr.navigateByUrl('/never-reuse/2/b'))
             .then((_) => {
               fixture.detectChanges();
               expect(log).toEqual([]);
               expect(fixture.debugElement.nativeElement).toHaveText('reuse {B}');
               expect(cmpInstanceCount).toBe(2);
               async.done();
             });
       }));


    it('should navigate when routerCanActivate returns true',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         compile(tcb)
             .then((rtc) => {fixture = rtc})
             .then((_) => rtr.config([new Route({path: '/...', component: LifecycleCmp})]))
             .then((_) => {
               ObservableWrapper.subscribe<string>(eventBus, (ev) => {
                 if (ev.startsWith('routerCanActivate')) {
                   completer.resolve(true);
                 }
               });
               rtr.navigateByUrl('/can-activate/a').then((_) => {
                 fixture.detectChanges();
                 expect(fixture.debugElement.nativeElement).toHaveText('routerCanActivate {A}');
                 expect(log).toEqual(['routerCanActivate: null -> /can-activate']);
                 async.done();
               });
             });
       }));

    it('should not navigate when routerCanActivate returns false',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         compile(tcb)
             .then((rtc) => {fixture = rtc})
             .then((_) => rtr.config([new Route({path: '/...', component: LifecycleCmp})]))
             .then((_) => {
               ObservableWrapper.subscribe<string>(eventBus, (ev) => {
                 if (ev.startsWith('routerCanActivate')) {
                   completer.resolve(false);
                 }
               });
               rtr.navigateByUrl('/can-activate/a').then((_) => {
                 fixture.detectChanges();
                 expect(fixture.debugElement.nativeElement).toHaveText('');
                 expect(log).toEqual(['routerCanActivate: null -> /can-activate']);
                 async.done();
               });
             });
       }));

    it('should navigate away when routerCanDeactivate returns true',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         compile(tcb)
             .then((rtc) => {fixture = rtc})
             .then((_) => rtr.config([new Route({path: '/...', component: LifecycleCmp})]))
             .then((_) => rtr.navigateByUrl('/can-deactivate/a'))
             .then((_) => {
               fixture.detectChanges();
               expect(fixture.debugElement.nativeElement).toHaveText('routerCanDeactivate {A}');
               expect(log).toEqual([]);

               ObservableWrapper.subscribe<string>(eventBus, (ev) => {
                 if (ev.startsWith('routerCanDeactivate')) {
                   completer.resolve(true);
                 }
               });

               rtr.navigateByUrl('/a').then((_) => {
                 fixture.detectChanges();
                 expect(fixture.debugElement.nativeElement).toHaveText('A');
                 expect(log).toEqual(['routerCanDeactivate: /can-deactivate -> /a']);
                 async.done();
               });
             });
       }));

    it('should not navigate away when routerCanDeactivate returns false',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         compile(tcb)
             .then((rtc) => {fixture = rtc})
             .then((_) => rtr.config([new Route({path: '/...', component: LifecycleCmp})]))
             .then((_) => rtr.navigateByUrl('/can-deactivate/a'))
             .then((_) => {
               fixture.detectChanges();
               expect(fixture.debugElement.nativeElement).toHaveText('routerCanDeactivate {A}');
               expect(log).toEqual([]);

               ObservableWrapper.subscribe<string>(eventBus, (ev) => {
                 if (ev.startsWith('routerCanDeactivate')) {
                   completer.resolve(false);
                 }
               });

               rtr.navigateByUrl('/a').then((_) => {
                 fixture.detectChanges();
                 expect(fixture.debugElement.nativeElement).toHaveText('routerCanDeactivate {A}');
                 expect(log).toEqual(['routerCanDeactivate: /can-deactivate -> /a']);
                 async.done();
               });
             });
       }));


    it('should run activation and deactivation hooks in the correct order',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         compile(tcb)
             .then((rtc) => {fixture = rtc})
             .then((_) => rtr.config([new Route({path: '/...', component: LifecycleCmp})]))
             .then((_) => rtr.navigateByUrl('/activation-hooks/child'))
             .then((_) => {
               expect(log).toEqual([
                 'routerCanActivate child: null -> /child',
                 'routerCanActivate parent: null -> /activation-hooks',
                 'routerOnActivate parent: null -> /activation-hooks',
                 'routerOnActivate child: null -> /child'
               ]);

               log = [];
               return rtr.navigateByUrl('/a');
             })
             .then((_) => {
               expect(log).toEqual([
                 'routerCanDeactivate parent: /activation-hooks -> /a',
                 'routerCanDeactivate child: /child -> null',
                 'routerOnDeactivate child: /child -> null',
                 'routerOnDeactivate parent: /activation-hooks -> /a'
               ]);
               async.done();
             });
       }));

    it('should only run reuse hooks when reusing',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         compile(tcb)
             .then((rtc) => {fixture = rtc})
             .then((_) => rtr.config([new Route({path: '/...', component: LifecycleCmp})]))
             .then((_) => rtr.navigateByUrl('/reuse-hooks/1'))
             .then((_) => {
               expect(log).toEqual([
                 'routerCanActivate: null -> /reuse-hooks/1',
                 'routerOnActivate: null -> /reuse-hooks/1'
               ]);

               ObservableWrapper.subscribe<string>(eventBus, (ev) => {
                 if (ev.startsWith('routerCanReuse')) {
                   completer.resolve(true);
                 }
               });


               log = [];
               return rtr.navigateByUrl('/reuse-hooks/2');
             })
             .then((_) => {
               expect(log).toEqual([
                 'routerCanReuse: /reuse-hooks/1 -> /reuse-hooks/2',
                 'routerOnReuse: /reuse-hooks/1 -> /reuse-hooks/2'
               ]);
               async.done();
             });
       }));

    it('should not run reuse hooks when not reusing',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         compile(tcb)
             .then((_) => rtr.config([new Route({path: '/...', component: LifecycleCmp})]))
             .then((_) => rtr.navigateByUrl('/reuse-hooks/1'))
             .then((_) => {
               expect(log).toEqual([
                 'routerCanActivate: null -> /reuse-hooks/1',
                 'routerOnActivate: null -> /reuse-hooks/1'
               ]);

               ObservableWrapper.subscribe<string>(eventBus, (ev) => {
                 if (ev.startsWith('routerCanReuse')) {
                   completer.resolve(false);
                 }
               });

               log = [];
               return rtr.navigateByUrl('/reuse-hooks/2');
             })
             .then((_) => {
               expect(log).toEqual([
                 'routerCanReuse: /reuse-hooks/1 -> /reuse-hooks/2',
                 'routerCanActivate: /reuse-hooks/1 -> /reuse-hooks/2',
                 'routerCanDeactivate: /reuse-hooks/1 -> /reuse-hooks/2',
                 'routerOnDeactivate: /reuse-hooks/1 -> /reuse-hooks/2',
                 'routerOnActivate: /reuse-hooks/1 -> /reuse-hooks/2'
               ]);
               async.done();
             });
       }));
  });
}


@Component({selector: 'a-cmp', template: 'A'})
class A {
}


@Component({selector: 'b-cmp', template: 'B'})
class B {
}


function logHook(name: string, next: ComponentInstruction, prev: ComponentInstruction) {
  var message = name + ': ' + (isPresent(prev) ? ('/' + prev.urlPath) : 'null') + ' -> ' +
      (isPresent(next) ? ('/' + next.urlPath) : 'null');
  log.push(message);
  ObservableWrapper.callEmit(eventBus, message);
}

@Component({selector: 'activate-cmp', template: 'activate cmp'})
class ActivateCmp implements OnActivate {
  routerOnActivate(next: ComponentInstruction, prev: ComponentInstruction) {
    logHook('activate', next, prev);
  }
}

@Component({
  selector: 'parent-activate-cmp',
  template: `parent {<router-outlet></router-outlet>}`,
  directives: [RouterOutlet]
})
@RouteConfig([new Route({path: '/child-activate', component: ActivateCmp})])
class ParentActivateCmp implements OnActivate {
  routerOnActivate(next: ComponentInstruction, prev: ComponentInstruction): Promise<any> {
    completer = PromiseWrapper.completer();
    logHook('parent activate', next, prev);
    return completer.promise;
  }
}

@Component({selector: 'deactivate-cmp', template: 'deactivate cmp'})
class DeactivateCmp implements OnDeactivate {
  routerOnDeactivate(next: ComponentInstruction, prev: ComponentInstruction) {
    logHook('deactivate', next, prev);
  }
}

@Component({selector: 'deactivate-cmp', template: 'deactivate cmp'})
class WaitDeactivateCmp implements OnDeactivate {
  routerOnDeactivate(next: ComponentInstruction, prev: ComponentInstruction): Promise<any> {
    completer = PromiseWrapper.completer();
    logHook('deactivate', next, prev);
    return completer.promise;
  }
}

@Component({
  selector: 'parent-deactivate-cmp',
  template: `parent {<router-outlet></router-outlet>}`,
  directives: [RouterOutlet]
})
@RouteConfig([new Route({path: '/child-deactivate', component: WaitDeactivateCmp})])
class ParentDeactivateCmp implements OnDeactivate {
  routerOnDeactivate(next: ComponentInstruction, prev: ComponentInstruction) {
    logHook('parent deactivate', next, prev);
  }
}

@Component({
  selector: 'reuse-cmp',
  template: `reuse {<router-outlet></router-outlet>}`,
  directives: [RouterOutlet]
})
@RouteConfig([new Route({path: '/a', component: A}), new Route({path: '/b', component: B})])
class ReuseCmp implements OnReuse,
    CanReuse {
  constructor() { cmpInstanceCount += 1; }
  routerCanReuse(next: ComponentInstruction, prev: ComponentInstruction) { return true; }
  routerOnReuse(next: ComponentInstruction, prev: ComponentInstruction) {
    logHook('reuse', next, prev);
  }
}

@Component({
  selector: 'never-reuse-cmp',
  template: `reuse {<router-outlet></router-outlet>}`,
  directives: [RouterOutlet]
})
@RouteConfig([new Route({path: '/a', component: A}), new Route({path: '/b', component: B})])
class NeverReuseCmp implements OnReuse,
    CanReuse {
  constructor() { cmpInstanceCount += 1; }
  routerCanReuse(next: ComponentInstruction, prev: ComponentInstruction) { return false; }
  routerOnReuse(next: ComponentInstruction, prev: ComponentInstruction) {
    logHook('reuse', next, prev);
  }
}

@Component({
  selector: 'can-activate-cmp',
  template: `routerCanActivate {<router-outlet></router-outlet>}`,
  directives: [RouterOutlet]
})
@RouteConfig([new Route({path: '/a', component: A}), new Route({path: '/b', component: B})])
@CanActivate(CanActivateCmp.routerCanActivate)
class CanActivateCmp {
  static routerCanActivate(next: ComponentInstruction, prev: ComponentInstruction):
      Promise<boolean> {
    completer = PromiseWrapper.completer();
    logHook('routerCanActivate', next, prev);
    return completer.promise;
  }
}

@Component({
  selector: 'can-deactivate-cmp',
  template: `routerCanDeactivate {<router-outlet></router-outlet>}`,
  directives: [RouterOutlet]
})
@RouteConfig([new Route({path: '/a', component: A}), new Route({path: '/b', component: B})])
class CanDeactivateCmp implements CanDeactivate {
  routerCanDeactivate(next: ComponentInstruction, prev: ComponentInstruction): Promise<boolean> {
    completer = PromiseWrapper.completer();
    logHook('routerCanDeactivate', next, prev);
    return completer.promise;
  }
}

@Component({selector: 'all-hooks-child-cmp', template: `child`})
@CanActivate(AllHooksChildCmp.routerCanActivate)
class AllHooksChildCmp implements CanDeactivate, OnDeactivate, OnActivate {
  routerCanDeactivate(next: ComponentInstruction, prev: ComponentInstruction) {
    logHook('routerCanDeactivate child', next, prev);
    return true;
  }

  routerOnDeactivate(next: ComponentInstruction, prev: ComponentInstruction) {
    logHook('routerOnDeactivate child', next, prev);
  }

  static routerCanActivate(next: ComponentInstruction, prev: ComponentInstruction) {
    logHook('routerCanActivate child', next, prev);
    return true;
  }

  routerOnActivate(next: ComponentInstruction, prev: ComponentInstruction) {
    logHook('routerOnActivate child', next, prev);
  }
}

@Component({
  selector: 'all-hooks-parent-cmp',
  template: `<router-outlet></router-outlet>`,
  directives: [RouterOutlet]
})
@RouteConfig([new Route({path: '/child', component: AllHooksChildCmp})])
@CanActivate(AllHooksParentCmp.routerCanActivate)
class AllHooksParentCmp implements CanDeactivate,
    OnDeactivate, OnActivate {
  routerCanDeactivate(next: ComponentInstruction, prev: ComponentInstruction) {
    logHook('routerCanDeactivate parent', next, prev);
    return true;
  }

  routerOnDeactivate(next: ComponentInstruction, prev: ComponentInstruction) {
    logHook('routerOnDeactivate parent', next, prev);
  }

  static routerCanActivate(next: ComponentInstruction, prev: ComponentInstruction) {
    logHook('routerCanActivate parent', next, prev);
    return true;
  }

  routerOnActivate(next: ComponentInstruction, prev: ComponentInstruction) {
    logHook('routerOnActivate parent', next, prev);
  }
}

@Component({selector: 'reuse-hooks-cmp', template: 'reuse hooks cmp'})
@CanActivate(ReuseHooksCmp.routerCanActivate)
class ReuseHooksCmp implements OnActivate, OnReuse, OnDeactivate, CanReuse, CanDeactivate {
  routerCanReuse(next: ComponentInstruction, prev: ComponentInstruction): Promise<any> {
    completer = PromiseWrapper.completer();
    logHook('routerCanReuse', next, prev);
    return completer.promise;
  }

  routerOnReuse(next: ComponentInstruction, prev: ComponentInstruction) {
    logHook('routerOnReuse', next, prev);
  }

  routerCanDeactivate(next: ComponentInstruction, prev: ComponentInstruction) {
    logHook('routerCanDeactivate', next, prev);
    return true;
  }

  routerOnDeactivate(next: ComponentInstruction, prev: ComponentInstruction) {
    logHook('routerOnDeactivate', next, prev);
  }

  static routerCanActivate(next: ComponentInstruction, prev: ComponentInstruction) {
    logHook('routerCanActivate', next, prev);
    return true;
  }

  routerOnActivate(next: ComponentInstruction, prev: ComponentInstruction) {
    logHook('routerOnActivate', next, prev);
  }
}

@Component({
  selector: 'lifecycle-cmp',
  template: `<router-outlet></router-outlet>`,
  directives: [RouterOutlet]
})
@RouteConfig([
  new Route({path: '/a', component: A}), new Route({path: '/on-activate', component: ActivateCmp}),
  new Route({path: '/parent-activate/...', component: ParentActivateCmp}),
  new Route({path: '/on-deactivate', component: DeactivateCmp}),
  new Route({path: '/parent-deactivate/...', component: ParentDeactivateCmp}),
  new Route({path: '/on-reuse/:number/...', component: ReuseCmp}),
  new Route({path: '/never-reuse/:number/...', component: NeverReuseCmp}),
  new Route({path: '/can-activate/...', component: CanActivateCmp}),
  new Route({path: '/can-deactivate/...', component: CanDeactivateCmp}),
  new Route({path: '/activation-hooks/...', component: AllHooksParentCmp}),
  new Route({path: '/reuse-hooks/:number', component: ReuseHooksCmp})
])
class LifecycleCmp {
}
