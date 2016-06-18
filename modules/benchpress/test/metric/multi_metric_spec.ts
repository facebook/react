import {
  afterEach,
  beforeEach,
  ddescribe,
  describe,
  expect,
  iit,
  inject,
  it,
  xit,
} from '@angular/core/testing';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';
import {Metric, MultiMetric, ReflectiveInjector} from 'benchpress/common';

export function main() {
  function createMetric(ids: any[]) {
    var m = ReflectiveInjector.resolveAndCreate([
                                ids.map(id => {return {provide: id, useValue: new MockMetric(id)}}),
                                MultiMetric.createBindings(ids)
                              ])
                .get(MultiMetric);
    return Promise.resolve(m);
  }

  describe('multi metric', () => {
    it('should merge descriptions', inject([AsyncTestCompleter], (async) => {
         createMetric(['m1', 'm2'])
             .then((m) => {
               expect(m.describe()).toEqual({'m1': 'describe', 'm2': 'describe'});
               async.done();
             });
       }));

    it('should merge all beginMeasure calls', inject([AsyncTestCompleter], (async) => {
         createMetric(['m1', 'm2'])
             .then((m) => m.beginMeasure())
             .then((values) => {
               expect(values).toEqual(['m1_beginMeasure', 'm2_beginMeasure']);
               async.done();
             });
       }));

    [false, true].forEach((restartFlag) => {
      it(`should merge all endMeasure calls for restart=${restartFlag}`,
         inject([AsyncTestCompleter], (async) => {
           createMetric(['m1', 'm2'])
               .then((m) => m.endMeasure(restartFlag))
               .then((values) => {
                 expect(values)
                     .toEqual({'m1': {'restart': restartFlag}, 'm2': {'restart': restartFlag}});
                 async.done();
               });
         }));
    });

  });
}

class MockMetric extends Metric {
  _id: string;

  constructor(id) {
    super();
    this._id = id;
  }

  beginMeasure(): Promise<string> { return Promise.resolve(`${this._id}_beginMeasure`); }

  endMeasure(restart: boolean): Promise<{[key: string]: any}> {
    var result = {};
    result[this._id] = {'restart': restart};
    return Promise.resolve(result);
  }

  describe(): {[key: string]: string} {
    var result: {[key: string]: string} = {};
    result[this._id] = 'describe';
    return result;
  }
}
