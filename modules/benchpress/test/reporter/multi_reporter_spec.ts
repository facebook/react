import {
  afterEach,
  AsyncTestCompleter,
  beforeEach,
  ddescribe,
  describe,
  expect,
  iit,
  inject,
  it,
  xit,
} from '@angular/testing/testing_internal';

import {PromiseWrapper} from '@angular/facade';
import {DateWrapper} from '@angular/facade';

import {
  Reporter,
  MultiReporter,
  ReflectiveInjector,
  MeasureValues
} from 'benchpress/common';

export function main() {
  function createReporters(ids: any[]) {
    var r = ReflectiveInjector.resolveAndCreate([
                                ids.map(id => { return {provide: id, useValue: new MockReporter(id)}}),
                                MultiReporter.createBindings(ids)
                              ])
                .get(MultiReporter);
    return PromiseWrapper.resolve(r);
  }

  describe('multi reporter', () => {

    it('should reportMeasureValues to all', inject([AsyncTestCompleter], (async) => {
         var mv = new MeasureValues(0, DateWrapper.now(), {});
         createReporters(['m1', 'm2'])
             .then((r) => r.reportMeasureValues(mv))
             .then((values) => {

               expect(values).toEqual([{'id': 'm1', 'values': mv}, {'id': 'm2', 'values': mv}]);
               async.done();
             });
       }));

    it('should reportSample to call', inject([AsyncTestCompleter], (async) => {
         var completeSample = [
           new MeasureValues(0, DateWrapper.now(), {}),
           new MeasureValues(1, DateWrapper.now(), {})
         ];
         var validSample = [completeSample[1]];

         createReporters(['m1', 'm2'])
             .then((r) => r.reportSample(completeSample, validSample))
             .then((values) => {

               expect(values).toEqual([
                 {'id': 'm1', 'completeSample': completeSample, 'validSample': validSample},
                 {'id': 'm2', 'completeSample': completeSample, 'validSample': validSample}
               ]);
               async.done();
             })
       }));

  });
}

class MockReporter extends Reporter {
  constructor(private _id: string) { super(); }

  reportMeasureValues(values: MeasureValues): Promise<{[key: string]: any}> {
    return PromiseWrapper.resolve({'id': this._id, 'values': values});
  }

  reportSample(completeSample: MeasureValues[],
               validSample: MeasureValues[]): Promise<{[key: string]: any}> {
    return PromiseWrapper.resolve(
        {'id': this._id, 'completeSample': completeSample, 'validSample': validSample});
  }
}
