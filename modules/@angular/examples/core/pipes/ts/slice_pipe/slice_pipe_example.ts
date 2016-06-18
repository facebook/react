import {Component} from '@angular/core';
import {bootstrap} from '@angular/platform-browser-dynamic';

// #docregion SlicePipe_string
@Component({
  selector: 'slice-string-example',
  template: `<div>
    <p>{{str}}[0:4]: '{{str | slice:0:4}}' - output is expected to be 'abcd'</p>
    <p>{{str}}[4:0]: '{{str | slice:4:0}}' - output is expected to be ''</p>
    <p>{{str}}[-4]: '{{str | slice:-4}}' - output is expected to be 'ghij'</p>
    <p>{{str}}[-4:-2]: '{{str | slice:-4:-2}}' - output is expected to be 'gh'</p>
    <p>{{str}}[-100]: '{{str | slice:-100}}' - output is expected to be 'abcdefghij'</p>
    <p>{{str}}[100]: '{{str | slice:100}}' - output is expected to be ''</p>
  </div>`
})
export class SlicePipeStringExample {
  str: string = 'abcdefghij';
}
// #enddocregion

// #docregion SlicePipe_list
@Component({
  selector: 'slice-list-example',
  template: `<div>
    <li *ngFor="let  i of collection | slice:1:3">{{i}}</li>
  </div>`
})
export class SlicePipeListExample {
  collection: string[] = ['a', 'b', 'c', 'd'];
}
// #enddocregion

@Component({
  selector: 'example-app',
  directives: [SlicePipeListExample, SlicePipeStringExample],
  template: `
    <h1>SlicePipe Examples</h1>
    <slice-list-example></slice-list-example>
    <slice-string-example></slice-string-example>
  `
})
export class AppCmp {
}

export function main() {
  bootstrap(AppCmp);
}
