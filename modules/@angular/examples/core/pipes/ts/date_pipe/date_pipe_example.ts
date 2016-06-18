import {Component} from '@angular/core';
import {bootstrap} from '@angular/platform-browser-dynamic';

// #docregion DatePipe
@Component({
  selector: 'date-example',
  template: `<div>
    <p>Today is {{today | date}}</p>
    <p>Or if you prefer, {{today | date:'fullDate'}}</p>
    <p>The time is {{today | date:'jmZ'}}</p>
  </div>`
})
export class DatePipeExample {
  today: number = Date.now();
}
// #enddocregion

@Component({
  selector: 'example-app',
  directives: [DatePipeExample],
  template: `
    <h1>DatePipe Example</h1>
    <date-example></date-example>
  `
})
export class AppCmp {
}

export function main() {
  bootstrap(AppCmp);
}
