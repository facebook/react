import {Component} from '@angular/core';
import {bootstrap} from '@angular/platform-browser-dynamic';

// #docregion JsonPipe
@Component({
  selector: 'json-example',
  template: `<div>
    <p>Without JSON pipe:</p>
    <pre>{{object}}</pre>
    <p>With JSON pipe:</p>
    <pre>{{object | json}}</pre>
  </div>`
})
export class JsonPipeExample {
  object: Object = {foo: 'bar', baz: 'qux', nested: {xyz: 3, numbers: [1, 2, 3, 4, 5]}};
}
// #enddocregion

@Component({
  selector: 'example-app',
  directives: [JsonPipeExample],
  template: `
    <h1>JsonPipe Example</h1>
    <json-example></json-example>
  `
})
export class AppCmp {
}

export function main() {
  bootstrap(AppCmp);
}
