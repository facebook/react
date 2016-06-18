import {ReflectiveInjector, provide} from '@angular/core';
import {ApplicationRef, ApplicationRef_} from '@angular/core/src/application_ref';
import {SpyObject} from '@angular/core/testing/testing_internal';

import {global} from '../../../src/facade/lang';

export class SpyApplicationRef extends SpyObject {
  constructor() { super(ApplicationRef_); }
}

export class SpyComponentRef extends SpyObject {
  injector: any /** TODO #9100 */;
  constructor() {
    super();
    this.injector = ReflectiveInjector.resolveAndCreate(
        [{provide: ApplicationRef, useClass: SpyApplicationRef}]);
  }
}

export function callNgProfilerTimeChangeDetection(config?: any /** TODO #9100 */): void {
  (<any>global).ng.profiler.timeChangeDetection(config);
}
