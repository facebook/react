import * as common from '@angular/common';
import {Component, Inject, OpaqueToken} from '@angular/core';

import {wrapInArray} from './funcs';

export const SOME_OPAQUE_TOKEN = new OpaqueToken('opaqueToken');

@Component({
  selector: 'comp-providers',
  template: '',
  providers: [
    {provide: 'strToken', useValue: 'strValue'},
    {provide: SOME_OPAQUE_TOKEN, useValue: 10},
    {provide: 'reference', useValue: common.NgIf},
    {provide: 'complexToken', useValue: {a: 1, b: ['test', SOME_OPAQUE_TOKEN]}},
  ]
})
export class CompWithProviders {
  constructor(@Inject('strToken') public ctxProp: string) {}
}

@Component({
  selector: 'cmp-reference',
  template: `
    <input #a>{{a.value}}
    <div *ngIf="true">{{a.value}}</div>
  `,
  directives: [wrapInArray(common.NgIf)]
})
export class CompWithReferences {
}
