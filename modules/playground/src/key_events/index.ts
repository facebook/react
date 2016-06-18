import {bootstrap} from '@angular/platform-browser-dynamic';
import {Component} from '@angular/core';
import {KeyEventsPlugin} from '@angular/platform-browser';

@Component({
  selector: 'key-events-app',
  template: `Click in the following area and press a key to display its name:<br>
  <div (keydown)="onKeyDown($event)" class="sample-area" tabindex="0">{{lastKey}}</div><br>
  Click in the following area and press shift.enter:<br>
  <div
    (keydown.shift.enter)="onShiftEnter($event)"
    (click)="resetShiftEnter()"
    class="sample-area"
    tabindex="0"
  >{{shiftEnter ? 'You pressed shift.enter!' : ''}}</div>`
})
class KeyEventsApp {
  lastKey: string = '(none)';
  shiftEnter: boolean = false;

  onKeyDown(event: any /** TODO #9100 */): void {
    this.lastKey = KeyEventsPlugin.getEventFullKey(event);
    event.preventDefault();
  }

  onShiftEnter(event: any /** TODO #9100 */): void {
    this.shiftEnter = true;
    event.preventDefault();
  }

  resetShiftEnter(): void { this.shiftEnter = false; }
}

export function main() {
  bootstrap(KeyEventsApp);
}
