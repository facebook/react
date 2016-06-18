import {bootstrap} from '@angular/platform-browser-dynamic';
import {Component} from '@angular/core';
import {Zippy} from './app/zippy';

@Component({
  selector: 'zippy-app',
  template: `
    <zippy (open)="pushLog('open')" (close)="pushLog('close')" title="Details">
      This is some content.
    </zippy>
    <ul>
      <li *ngFor="let  log of logs">{{log}}</li>
    </ul>
  `,
  directives: [Zippy]
})
class ZippyApp {
  logs: string[] = [];

  pushLog(log: string) { this.logs.push(log); }
}

export function main() {
  bootstrap(ZippyApp);
}
