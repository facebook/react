import {APP_BASE_HREF} from '@angular/common';
import {Component, ComponentRef, provide} from '@angular/core';
import {bootstrap} from '@angular/platform-browser-dynamic';
import {CanDeactivate, ComponentInstruction, ROUTER_DIRECTIVES, RouteConfig, RouteParams} from '@angular/router-deprecated';


// #docregion routerCanDeactivate
@Component({
  selector: 'note-cmp',
  template: `
    <div>
      <h2>id: {{id}}</h2>
      <textarea cols="40" rows="10"></textarea>
    </div>`
})
class NoteCmp implements CanDeactivate {
  id: string;

  constructor(params: RouteParams) { this.id = params.get('id'); }

  routerCanDeactivate(next: ComponentInstruction, prev: ComponentInstruction) {
    return confirm('Are you sure you want to leave?');
  }
}
// #enddocregion


@Component({
  selector: 'note-index-cmp',
  template: `
    <h1>Your Notes</h1>
    <div>
      Edit <a [routerLink]="['/NoteCmp', {id: 1}]" id="note-1-link">Note 1</a> |
      Edit <a [routerLink]="['/NoteCmp', {id: 2}]" id="note-2-link">Note 2</a>
    </div>
  `,
  directives: [ROUTER_DIRECTIVES]
})
class NoteIndexCmp {
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
  {path: '/note/:id', component: NoteCmp, name: 'NoteCmp'},
  {path: '/', component: NoteIndexCmp, name: 'NoteIndexCmp'}
])
export class AppCmp {
}


export function main(): Promise<ComponentRef<AppCmp>> {
  return bootstrap(
      AppCmp, [{provide: APP_BASE_HREF, useValue: '/@angular/examples/router/ts/can_deactivate'}]);
}
