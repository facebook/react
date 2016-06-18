import {NG_VALIDATORS} from '@angular/common';
import {bootstrap} from '@angular/platform-browser-dynamic';

let MyApp: Function = null;
let myValidator: any = null;

// #docregion ng_validators
bootstrap(MyApp, [{provide: NG_VALIDATORS, useValue: myValidator, multi: true}]);
// #enddocregion
