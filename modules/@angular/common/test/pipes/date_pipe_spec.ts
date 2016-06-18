import {DatePipe} from '@angular/common';
import {PipeResolver} from '@angular/compiler/src/pipe_resolver';
import {afterEach, beforeEach, ddescribe, describe, expect, iit, it, xit} from '@angular/core/testing/testing_internal';
import {browserDetection} from '@angular/platform-browser/testing';

import {DateWrapper} from '../../src/facade/lang';

export function main() {
  describe('DatePipe', () => {
    var date: Date;
    var pipe: DatePipe;

    beforeEach(() => {
      date = DateWrapper.create(2015, 6, 15, 21, 3, 1);
      pipe = new DatePipe();
    });

    it('should be marked as pure',
       () => { expect(new PipeResolver().resolve(DatePipe).pure).toEqual(true); });

    // TODO(mlaval): enable tests when Intl API is no longer used, see
    // https://github.com/angular/angular/issues/3333
    // Have to restrict to Chrome as IE uses a different formatting
    if (browserDetection.supportsIntlApi && browserDetection.isChromeDesktop) {
      describe('supports', () => {
        it('should support date', () => { expect(() => pipe.transform(date)).not.toThrow(); });
        it('should support int', () => { expect(() => pipe.transform(123456789)).not.toThrow(); });
        it('should support numeric strings',
           () => { expect(() => pipe.transform('123456789')).not.toThrow(); });

        it('should support ISO string',
           () => { expect(() => pipe.transform('2015-06-15T21:43:11Z')).not.toThrow(); });

        it('should not support other objects', () => {
          expect(() => pipe.transform({})).toThrow();
          expect(() => pipe.transform('')).toThrow();
        });
      });

      describe('transform', () => {
        it('should format each component correctly', () => {
          expect(pipe.transform(date, 'y')).toEqual('2015');
          expect(pipe.transform(date, 'yy')).toEqual('15');
          expect(pipe.transform(date, 'M')).toEqual('6');
          expect(pipe.transform(date, 'MM')).toEqual('06');
          expect(pipe.transform(date, 'MMM')).toEqual('Jun');
          expect(pipe.transform(date, 'MMMM')).toEqual('June');
          expect(pipe.transform(date, 'd')).toEqual('15');
          expect(pipe.transform(date, 'E')).toEqual('Mon');
          expect(pipe.transform(date, 'EEEE')).toEqual('Monday');
          expect(pipe.transform(date, 'H')).toEqual('21');
          expect(pipe.transform(date, 'j')).toEqual('9 PM');
          expect(pipe.transform(date, 'm')).toEqual('3');
          expect(pipe.transform(date, 's')).toEqual('1');
          expect(pipe.transform(date, 'mm')).toEqual('03');
          expect(pipe.transform(date, 'ss')).toEqual('01');
        });

        it('should format common multi component patterns', () => {
          expect(pipe.transform(date, 'E, M/d/y')).toEqual('Mon, 6/15/2015');
          expect(pipe.transform(date, 'E, M/d')).toEqual('Mon, 6/15');
          expect(pipe.transform(date, 'MMM d')).toEqual('Jun 15');
          expect(pipe.transform(date, 'dd/MM/yyyy')).toEqual('15/06/2015');
          expect(pipe.transform(date, 'MM/dd/yyyy')).toEqual('06/15/2015');
          expect(pipe.transform(date, 'yMEd')).toEqual('20156Mon15');
          expect(pipe.transform(date, 'MEd')).toEqual('6Mon15');
          expect(pipe.transform(date, 'MMMd')).toEqual('Jun15');
          expect(pipe.transform(date, 'yMMMMEEEEd')).toEqual('Monday, June 15, 2015');
          expect(pipe.transform(date, 'jms')).toEqual('9:03:01 PM');
          expect(pipe.transform(date, 'ms')).toEqual('31');
          expect(pipe.transform(date, 'jm')).toEqual('9:03 PM');
        });

        it('should format with pattern aliases', () => {
          expect(pipe.transform(date, 'medium')).toEqual('Jun 15, 2015, 9:03:01 PM');
          expect(pipe.transform(date, 'short')).toEqual('6/15/2015, 9:03 PM');
          expect(pipe.transform(date, 'dd/MM/yyyy')).toEqual('15/06/2015');
          expect(pipe.transform(date, 'MM/dd/yyyy')).toEqual('06/15/2015');
          expect(pipe.transform(date, 'fullDate')).toEqual('Monday, June 15, 2015');
          expect(pipe.transform(date, 'longDate')).toEqual('June 15, 2015');
          expect(pipe.transform(date, 'mediumDate')).toEqual('Jun 15, 2015');
          expect(pipe.transform(date, 'shortDate')).toEqual('6/15/2015');
          expect(pipe.transform(date, 'mediumTime')).toEqual('9:03:01 PM');
          expect(pipe.transform(date, 'shortTime')).toEqual('9:03 PM');
        });
      });
    }
  });
}
