import {BaseException} from '@angular/core/src/facade/exceptions';
import {bootstrap} from '@angular/platform-browser-dynamic';
import {Component} from '@angular/core';

@Component({
  selector: 'error-app',
  template: `
           <button class="errorButton" (click)="createError()">create error</button>`
})
export class ErrorComponent {
  createError(): void { throw new BaseException('Sourcemap test'); }
}

export function main() {
  bootstrap(ErrorComponent);
}
