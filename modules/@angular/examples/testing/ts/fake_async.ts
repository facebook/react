import {clearPendingTimers, describe, expect, fakeAsync, it, tick} from '@angular/core/testing';


// #docregion basic
describe('this test', () => {
  it('looks async but is synchronous', <any>fakeAsync((): void => {
       var flag = false;
       setTimeout(() => { flag = true; }, 100);
       expect(flag).toBe(false);
       tick(50);
       expect(flag).toBe(false);
       tick(50);
       expect(flag).toBe(true);
     }));
});
// #enddocregion

// #docregion pending
describe('this test', () => {
  it('aborts a timer', <any>fakeAsync((): void => {
       // This timer is scheduled but doesn't need to complete for the
       // test to pass (maybe it's a timeout for some operation).
       // Leaving it will cause the test to fail...
       setTimeout(() => {}, 100);

       // Unless we clean it up first.
       clearPendingTimers();
     }));
});
// #enddocregion
