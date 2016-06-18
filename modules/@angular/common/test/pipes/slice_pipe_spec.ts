import {ddescribe, describe, it, iit, xit, expect, beforeEach, afterEach, inject,} from '@angular/core/testing/testing_internal';
import {} from '@angular/core/testing/testing_internal';
import {browserDetection} from '@angular/platform-browser/testing';
import {TestComponentBuilder, ComponentFixture} from '@angular/compiler/testing';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';

import {Component} from '@angular/core';
import {SlicePipe} from '@angular/common';

export function main() {
  describe('SlicePipe', () => {
    var list: number[];
    var str: string;
    var pipe: SlicePipe;

    beforeEach(() => {
      list = [1, 2, 3, 4, 5];
      str = 'tuvwxyz';
      pipe = new SlicePipe();
    });

    describe('supports', () => {
      it('should support strings', () => { expect(() => pipe.transform(str, 0)).not.toThrow(); });
      it('should support lists', () => { expect(() => pipe.transform(list, 0)).not.toThrow(); });

      it('should not support other objects',
         () => { expect(() => pipe.transform({}, 0)).toThrow(); });
    });

    describe('transform', () => {

      it('should return null if the value is null',
         () => { expect(pipe.transform(null, 1)).toBe(null); });

      it('should return all items after START index when START is positive and END is omitted',
         () => {
           expect(pipe.transform(list, 3)).toEqual([4, 5]);
           expect(pipe.transform(str, 3)).toEqual('wxyz');
         });

      it('should return last START items when START is negative and END is omitted', () => {
        expect(pipe.transform(list, -3)).toEqual([3, 4, 5]);
        expect(pipe.transform(str, -3)).toEqual('xyz');
      });

      it('should return all items between START and END index when START and END are positive',
         () => {
           expect(pipe.transform(list, 1, 3)).toEqual([2, 3]);
           expect(pipe.transform(str, 1, 3)).toEqual('uv');
         });

      it('should return all items between START and END from the end when START and END are negative',
         () => {
           expect(pipe.transform(list, -4, -2)).toEqual([2, 3]);
           expect(pipe.transform(str, -4, -2)).toEqual('wx');
         });

      it('should return an empty value if START is greater than END', () => {
        expect(pipe.transform(list, 4, 2)).toEqual([]);
        expect(pipe.transform(str, 4, 2)).toEqual('');
      });

      it('should return an empty value if START greater than input length', () => {
        expect(pipe.transform(list, 99)).toEqual([]);
        expect(pipe.transform(str, 99)).toEqual('');
      });

      // Makes Edge to disconnect when running the full unit test campaign
      // TODO: remove when issue is solved: https://github.com/angular/angular/issues/4756
      if (!browserDetection.isEdge) {
        it('should return entire input if START is negative and greater than input length', () => {
          expect(pipe.transform(list, -99)).toEqual([1, 2, 3, 4, 5]);
          expect(pipe.transform(str, -99)).toEqual('tuvwxyz');
        });

        it('should not modify the input list', () => {
          expect(pipe.transform(list, 2)).toEqual([3, 4, 5]);
          expect(list).toEqual([1, 2, 3, 4, 5]);
        });
      }

    });

    describe('integration', () => {
      it('should work with mutable arrays',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.createAsync(TestComp).then((fixture) => {
                 let mutable: number[] = [1, 2];
                 fixture.debugElement.componentInstance.data = mutable;
                 fixture.detectChanges();
                 expect(fixture.debugElement.nativeElement).toHaveText('2');

                 mutable.push(3);
                 fixture.detectChanges();
                 expect(fixture.debugElement.nativeElement).toHaveText('2,3');

                 async.done();
               });
             }));
    });
  });
}

@Component({selector: 'test-comp', template: '{{(data | slice:1).join(",") }}', pipes: [SlicePipe]})
class TestComp {
  data: any;
}
