import {Component} from '@angular/core';
import {bootstrap} from '@angular/platform-browser';

@Component({
  selector: 'hello-app',
  template: `
    <h1>Hello, {{name}}!</h1>
    <label> Say hello to: <input [value]="name" (input)="name = $event.target.value"></label>
`
})
export class HelloCmp {
  name = 'World';
}

bootstrap(HelloCmp);
