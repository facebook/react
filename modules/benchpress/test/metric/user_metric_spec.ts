import {ReflectiveInjector} from "angular2/core";
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
  xit
} from 'angular2/testing_internal';

import {TimerWrapper} from 'angular2/src/facade/async';
import {StringMapWrapper} from 'angular2/src/facade/collection';
import {PromiseWrapper} from 'angular2/src/facade/async';
import {isPresent, isBlank, Json} from 'angular2/src/facade/lang';

import {
  Metric,
  MultiMetric,
  PerflogMetric,
  UserMetric,
  WebDriverAdapter,
  WebDriverExtension,
  PerfLogFeatures,
  bind,
  provide,
  Injector,
  Options
} from 'benchpress/common';

export function main() {
  var wdAdapter: MockDriverAdapter;

  function createMetric(perfLogs, perfLogFeatures,
                        {userMetrics}: {userMetrics?: {[key: string]: string}} = {}): UserMetric {
    if (isBlank(perfLogFeatures)) {
      perfLogFeatures =
          new PerfLogFeatures({render: true, gc: true, frameCapture: true, userTiming: true});
    }
    if (isBlank(userMetrics)) {
      userMetrics = StringMapWrapper.create();
    }
    wdAdapter = new MockDriverAdapter();
    var bindings = [
      Options.DEFAULT_PROVIDERS,
      UserMetric.BINDINGS,
      bind(Options.USER_METRICS).toValue(userMetrics),
      provide(WebDriverAdapter, {useValue: wdAdapter})
    ];
    return ReflectiveInjector.resolveAndCreate(bindings).get(UserMetric);
  }

  describe('user metric', () => {

    it('should describe itself based on userMetrics', () => {
      expect(createMetric([[]], new PerfLogFeatures(), {userMetrics: {'loadTime': 'time to load'}})
                 .describe())
          .toEqual({'loadTime': 'time to load'});
    });

    describe('endMeasure', () => {
      it('should stop measuring when all properties have numeric values',
         inject([AsyncTestCompleter], (async) => {
           let metric = createMetric(
               [[]], new PerfLogFeatures(),
               {userMetrics: {'loadTime': 'time to load', 'content': 'time to see content'}});
           metric.beginMeasure()
               .then((_) => metric.endMeasure(true))
               .then((values: {[key: string]: string}) => {
                 expect(values['loadTime']).toBe(25);
                 expect(values['content']).toBe(250);
                 async.done();
               });

           wdAdapter.data['loadTime'] = 25;
           // Wait before setting 2nd property.
           TimerWrapper.setTimeout(() => { wdAdapter.data['content'] = 250; }, 50);

         }), 600);
    });
  });
}

class MockDriverAdapter extends WebDriverAdapter {
  data: any = {};

  executeScript(script: string): any {
    // Just handles `return window.propName` ignores `delete window.propName`.
    if (script.indexOf('return window.') == 0) {
      let metricName = script.substring('return window.'.length);
      return PromiseWrapper.resolve(this.data[metricName]);
    } else if (script.indexOf('delete window.') == 0) {
      return PromiseWrapper.resolve(null);
    } else {
      return PromiseWrapper.reject(`Unexpected syntax: ${script}`, null);
    }
  }
}
