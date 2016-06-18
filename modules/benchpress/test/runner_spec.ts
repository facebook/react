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
import {
  Runner,
  Sampler,
  SampleDescription,
  Validator,
  ReflectiveInjector,
  Injector,
  Metric,
  Options,
  WebDriverAdapter,
  SampleState
} from 'benchpress/common';
import {isBlank} from '@angular/facade';
import {PromiseWrapper} from '@angular/facade';

export function main() {
  describe('runner', () => {
    var injector: ReflectiveInjector;
    var runner;

    function createRunner(defaultBindings = null): Runner {
      if (isBlank(defaultBindings)) {
        defaultBindings = [];
      }
      runner = new Runner([
        defaultBindings,
        {
          provide: Sampler,
          useFactory: (_injector) => {
            injector = _injector;
            return new MockSampler();
          },
          deps: [Injector]
        },
        { provide: Metric, useFactory: () => new MockMetric(), deps: []},
        { provide: Validator, useFactory: () => new MockValidator(), deps: []},
        { provide: WebDriverAdapter, useFactory: () => new MockWebDriverAdapter(), deps: []}
      ]);
      return runner;
    }

    it('should set SampleDescription.id', inject([AsyncTestCompleter], (async) => {
         createRunner()
             .sample({id: 'someId'})
             .then((_) => injector.get(SampleDescription))
             .then((desc) => {
               expect(desc.id).toBe('someId');
               async.done();
             });
       }));

    it('should merge SampleDescription.description', inject([AsyncTestCompleter], (async) => {
         createRunner([{provide: Options.DEFAULT_DESCRIPTION, useValue: {'a': 1}}])
             .sample({id: 'someId', providers: [{provide: Options.SAMPLE_DESCRIPTION, useValue: {'b': 2}}]})
             .then((_) => injector.get(SampleDescription))
             .then((desc) => {
               expect(desc.description)
                   .toEqual(
                       {'forceGc': false, 'userAgent': 'someUserAgent', 'a': 1, 'b': 2, 'v': 11});
               async.done();
             });
       }));

    it('should fill SampleDescription.metrics from the Metric',
       inject([AsyncTestCompleter], (async) => {
         createRunner()
             .sample({id: 'someId'})
             .then((_) => injector.get(SampleDescription))
             .then((desc) => {

               expect(desc.metrics).toEqual({'m1': 'some metric'});
               async.done();
             });
       }));

    it('should bind Options.EXECUTE', inject([AsyncTestCompleter], (async) => {
         var execute = () => {};
         createRunner()
             .sample({id: 'someId', execute: execute})
             .then((_) => {
               expect(injector.get(Options.EXECUTE)).toEqual(execute);
               async.done();
             });
       }));

    it('should bind Options.PREPARE', inject([AsyncTestCompleter], (async) => {
         var prepare = () => {};
         createRunner()
             .sample({id: 'someId', prepare: prepare})
             .then((_) => {
               expect(injector.get(Options.PREPARE)).toEqual(prepare);
               async.done();
             });
       }));

    it('should bind Options.MICRO_METRICS', inject([AsyncTestCompleter], (async) => {
         createRunner()
             .sample({id: 'someId', microMetrics: {'a': 'b'}})
             .then((_) => {
               expect(injector.get(Options.MICRO_METRICS)).toEqual({'a': 'b'});
               async.done();
             });
       }));

    it('should overwrite bindings per sample call', inject([AsyncTestCompleter], (async) => {
         createRunner([{provide: Options.DEFAULT_DESCRIPTION, useValue: {'a': 1}}])
             .sample({
               id: 'someId',
               providers: [{provide: Options.DEFAULT_DESCRIPTION, useValue: {'a': 2}}]
             })
             .then((_) => injector.get(SampleDescription))
             .then((desc) => {

               expect(desc.description['a']).toBe(2);
               async.done();
             });

       }));

  });
}

class MockWebDriverAdapter extends WebDriverAdapter {
  executeScript(script): Promise<string> { return PromiseWrapper.resolve('someUserAgent'); }
  capabilities() { return null; }
}

class MockValidator extends Validator {
  constructor() { super(); }
  describe() { return {'v': 11}; }
}

class MockMetric extends Metric {
  constructor() { super(); }
  describe() { return {'m1': 'some metric'}; }
}

class MockSampler extends Sampler {
  constructor() { super(); }
  sample(): Promise<SampleState> { return PromiseWrapper.resolve(new SampleState([], [])); }
}
