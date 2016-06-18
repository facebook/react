import {Component} from '@angular/core';
import {bootstrap} from '@angular/platform-browser-dynamic';

// #docregion NumberPipe
@Component({
  selector: 'number-example',
  template: `<div>
    <p>e (no formatting): {{e}}</p>
    <p>e (3.1-5): {{e | number:'3.1-5'}}</p>
    <p>pi (no formatting): {{pi}}</p>
    <p>pi (3.5-5): {{pi | number:'3.5-5'}}</p>
  </div>`
})
export class NumberPipeExample {
  pi: number = 3.141;
  e: number = 2.718281828459045;
}
// #enddocregion

// #docregion PercentPipe
@Component({
  selector: 'percent-example',
  template: `<div>
    <p>A: {{a | percent}}</p>
    <p>B: {{b | percent:'4.3-5'}}</p>
  </div>`
})
export class PercentPipeExample {
  a: number = 0.259;
  b: number = 1.3495;
}
// #enddocregion

// #docregion CurrencyPipe
@Component({
  selector: 'currency-example',
  template: `<div>
    <p>A: {{a | currency:'USD':false}}</p>
    <p>B: {{b | currency:'USD':true:'4.2-2'}}</p>
  </div>`
})
export class CurrencyPipeExample {
  a: number = 0.259;
  b: number = 1.3495;
}
// #enddocregion

@Component({
  selector: 'example-app',
  directives: [NumberPipeExample, PercentPipeExample, CurrencyPipeExample],
  template: `
    <h1>Numeric Pipe Examples</h1>
    <h2>NumberPipe Example</h2>
    <number-example></number-example>
    <h2>PercentPipe Example</h2>
    <percent-example></percent-example>
    <h2>CurrencyPipeExample</h2>
    <currency-example></currency-example>
  `
})
export class AppCmp {
}

export function main() {
  bootstrap(AppCmp);
}
