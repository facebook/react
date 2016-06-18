import {APP_BASE_HREF} from '@angular/common';
import {Component, ComponentRef} from '@angular/core';
import {bootstrap} from '@angular/platform-browser-dynamic';
import {CanActivate, ComponentInstruction, ROUTER_DIRECTIVES, RouteConfig} from '@angular/router-deprecated';

function checkIfWeHavePermission(instruction: ComponentInstruction) {
  return instruction.params['id'] == '1';
}

// #docregion canActivate
@Component({selector: 'control-panel-cmp', template: `<div>Settings: ...</div>`})
@CanActivate(checkIfWeHavePermission)
class ControlPanelCmp {
}
// #enddocregion


@Component({
  selector: 'home-cmp',
  template: `
    <h1>Welcome Home!</h1>
    <div>
      Edit <a [routerLink]="['/ControlPanelCmp', {id: 1}]" id="user-1-link">User 1</a> |
      Edit <a [routerLink]="['/ControlPanelCmp', {id: 2}]" id="user-2-link">User 2</a>
    </div>
  `,
  directives: [ROUTER_DIRECTIVES]
})
class HomeCmp {
}


@Component({
  selector: 'example-app',
  template: `
    <h1>My App</h1>
    <router-outlet></router-outlet>
  `,
  directives: [ROUTER_DIRECTIVES]
})
@RouteConfig([
  {path: '/user-settings/:id', component: ControlPanelCmp, name: 'ControlPanelCmp'},
  {path: '/', component: HomeCmp, name: 'HomeCmp'}
])
export class AppCmp {
}


export function main(): Promise<ComponentRef<AppCmp>> {
  return bootstrap(
      AppCmp, [{provide: APP_BASE_HREF, useValue: '/@angular/examples/router/ts/can_activate'}]);
}
