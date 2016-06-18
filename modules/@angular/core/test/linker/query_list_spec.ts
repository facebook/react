import {describe, it, expect, beforeEach, ddescribe, iit, xit,} from '@angular/core/testing/testing_internal';
import {fakeAsync, tick,} from '@angular/core/testing';
import {MapWrapper, ListWrapper, iterateListLike} from '../../src/facade/collection';
import {IS_DART, StringWrapper} from '../../src/facade/lang';
import {ObservableWrapper} from '../../src/facade/async';
import {QueryList} from '@angular/core/src/linker/query_list';
import {getDOM} from '@angular/platform-browser/src/dom/dom_adapter';

interface _JsQueryList {
  filter(c: any): any;
  reduce(a: any, b: any): any;
  toArray(): any;
}

export function main() {
  describe('QueryList', () => {
    var queryList: QueryList<string>;
    var log: string;
    beforeEach(() => {
      queryList = new QueryList<string>();
      log = '';
    });

    function logAppend(item: any /** TODO #9100 */) { log += (log.length == 0 ? '' : ', ') + item; }

    it('should support resetting and iterating over the new objects', () => {
      queryList.reset(['one']);
      queryList.reset(['two']);
      iterateListLike(queryList, logAppend);
      expect(log).toEqual('two');
    });

    it('should support length', () => {
      queryList.reset(['one', 'two']);
      expect(queryList.length).toEqual(2);
    });

    it('should support map', () => {
      queryList.reset(['one', 'two']);
      expect(queryList.map((x) => x)).toEqual(['one', 'two']);
    });

    it('should support map with index', () => {
      queryList.reset(['one', 'two']);
      expect(queryList.map((x, i) => `${x}_${i}`)).toEqual(['one_0', 'two_1']);
    });

    it('should support forEach', () => {
      queryList.reset(['one', 'two']);
      let join = '';
      queryList.forEach((x) => join = join + x);
      expect(join).toEqual('onetwo');
    });

    it('should support forEach with index', () => {
      queryList.reset(['one', 'two']);
      let join = '';
      queryList.forEach((x, i) => join = join + x + i);
      expect(join).toEqual('one0two1');
    });

    if (!IS_DART) {
      it('should support filter', () => {
        queryList.reset(['one', 'two']);
        expect((<_JsQueryList>queryList).filter((x: string) => x == 'one')).toEqual(['one']);
      });

      it('should support filter with index', () => {
        queryList.reset(['one', 'two']);
        expect((<_JsQueryList>queryList).filter((x: string, i: number) => i == 0)).toEqual(['one']);
      });

      it('should support reduce', () => {
        queryList.reset(['one', 'two']);
        expect((<_JsQueryList>queryList).reduce((a: string, x: string) => a + x, 'start:'))
            .toEqual('start:onetwo');
      });

      it('should support reduce with index', () => {
        queryList.reset(['one', 'two']);
        expect((<_JsQueryList>queryList)
                   .reduce((a: string, x: string, i: number) => a + x + i, 'start:'))
            .toEqual('start:one0two1');
      });

      it('should support toArray', () => {
        queryList.reset(['one', 'two']);
        expect((<_JsQueryList>queryList).reduce((a: string, x: string) => a + x, 'start:'))
            .toEqual('start:onetwo');
      });

      it('should support toArray', () => {
        queryList.reset(['one', 'two']);
        expect((<_JsQueryList>queryList).toArray()).toEqual(['one', 'two']);
      });
    }

    it('should support toString', () => {
      queryList.reset(['one', 'two']);
      var listString = queryList.toString();
      expect(StringWrapper.contains(listString, 'one')).toBeTruthy();
      expect(StringWrapper.contains(listString, 'two')).toBeTruthy();
    });

    it('should support first and last', () => {
      queryList.reset(['one', 'two', 'three']);
      expect(queryList.first).toEqual('one');
      expect(queryList.last).toEqual('three');
    });

    if (getDOM().supportsDOMEvents()) {
      describe('simple observable interface', () => {
        it('should fire callbacks on change', fakeAsync(() => {
             var fires = 0;
             ObservableWrapper.subscribe(queryList.changes, (_) => { fires += 1; });

             queryList.notifyOnChanges();
             tick();

             expect(fires).toEqual(1);

             queryList.notifyOnChanges();
             tick();

             expect(fires).toEqual(2);
           }));

        it('should provides query list as an argument', fakeAsync(() => {
             var recorded: any /** TODO #9100 */;
             ObservableWrapper.subscribe(queryList.changes, (v: any) => { recorded = v; });

             queryList.reset(['one']);
             queryList.notifyOnChanges();
             tick();

             expect(recorded).toBe(queryList);
           }));
      });
    }
  });
}
