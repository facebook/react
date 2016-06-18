import {Component} from '@angular/core';
import {bootstrap} from '@angular/platform-browser-dynamic';
import {Observable, Subscriber} from 'rxjs/Rx';

// #docregion AsyncPipePromise
@Component({
  selector: 'async-example',
  template: `<div>
    <p>Wait for it... {{ greeting | async }}</p>
    <button (click)="clicked()">{{ arrived ? 'Reset' : 'Resolve' }}</button>
  </div>`
})
export class AsyncPipeExample {
  greeting: Promise<string> = null;
  arrived: boolean = false;

  private resolve: Function = null;

  constructor() { this.reset(); }

  reset() {
    this.arrived = false;
    this.greeting = new Promise<string>((resolve, reject) => { this.resolve = resolve; });
  }

  clicked() {
    if (this.arrived) {
      this.reset();
    } else {
      this.resolve('hi there!');
      this.arrived = true;
    }
  }
}
// #enddocregion

// #docregion AsyncPipeObservable
@Component({selector: 'task-cmp', template: 'Time: {{ time | async }}'})
class Task {
  time = new Observable<number>((observer: Subscriber<number>) => {
    setInterval(() => observer.next(new Date().getTime()), 500);
  });
}
// #enddocregion

@Component({
  selector: 'example-app',
  directives: [AsyncPipeExample],
  template: `
    <h1>AsyncPipe Example</h1>
    <async-example></async-example>
  `
})
export class AppCmp {
}

export function main() {
  bootstrap(AppCmp);
}
