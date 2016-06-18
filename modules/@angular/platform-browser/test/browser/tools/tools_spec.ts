import {afterEach, beforeEach, ddescribe, describe, expect, iit, inject, it, xit} from '@angular/core/testing/testing_internal';
import {disableDebugTools, enableDebugTools} from '@angular/platform-browser';

import {SpyComponentRef, callNgProfilerTimeChangeDetection} from './spies';

export function main() {
  describe('profiler', () => {
    beforeEach(() => { enableDebugTools((<any>new SpyComponentRef())); });

    afterEach(() => { disableDebugTools(); });

    it('should time change detection', () => { callNgProfilerTimeChangeDetection(); });

    it('should time change detection with recording',
       () => { callNgProfilerTimeChangeDetection({'record': true}); });
  });
}
