import {APP_BASE_HREF} from '@angular/common';
import {Component, ComponentRef, provide} from '@angular/core';
import {bootstrap} from '@angular/platform-browser-dynamic';
import {ComponentInstruction, OnActivate, ROUTER_DIRECTIVES, RouteConfig} from '@angular/router-deprecated';


// #docregion routerOnActivate
@Component({template: `Child`})
class ChildCmp {
}

@Component({
  template: `
    <h2>Parent</h2> (<router-outlet></router-outlet>)
    <p>{{log}}</p>`,
  directives: [ROUTER_DIRECTIVES]
})
@RouteConfig([{path: '/child', name: 'Child', component: ChildCmp}])
class ParentCmp implements OnActivate {
  log: string = '';

  routerOnActivate(next: ComponentInstruction, prev: ComponentInstruction) {
    this.log = `Finished navigating from "${prev ? prev.urlPath : 'null'}" to "${next.urlPath}"`;

    return new Promise(resolve => {
      // The ChildCmp gets instantiated only when the Promise is resolved
      setTimeout(() => resolve(null), 1000);
    });
  }
}
// #enddocregion


@Component({
  selector: 'example-app',
  template: `
    <h1>My app</h1>

    <nav>
      <a [routerLink]="['Parent', 'Child']">Child</a>
    </nav>
    <router-outlet></router-outlet>
  `,
  directives: [ROUTER_DIRECTIVES]
})
@RouteConfig([{path: '/parent/...', name: 'Parent', component: ParentCmp}])
export class AppCmp {
}

export function main(): Promise<ComponentRef<AppCmp>> {
  return bootstrap(
      AppCmp, [{provide: APP_BASE_HREF, useValue: '/@angular/examples/router/ts/on_activate'}]);
}
