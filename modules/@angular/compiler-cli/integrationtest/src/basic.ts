import {FORM_DIRECTIVES, NgFor, NgIf} from '@angular/common';
import {Component, Inject} from '@angular/core';

import {MyComp} from './a/multiple_components';

@Component({
  selector: 'basic',
  templateUrl: './basic.html',
  styles: ['.red { color: red }'],
  styleUrls: ['./basic.css'],
  directives: [MyComp, FORM_DIRECTIVES, NgIf, NgFor]
})
export class Basic {
  ctxProp: string;
  ctxBool: boolean;
  ctxArr: any[] = [];
  constructor() { this.ctxProp = 'initialValue'; }
}
