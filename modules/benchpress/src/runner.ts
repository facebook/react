import {ReflectiveInjector} from '@angular/core';
import {isPresent, isBlank} from '@angular/facade';
import {PromiseWrapper} from '@angular/facade';

import {Sampler, SampleState} from './sampler';
import {ConsoleReporter} from './reporter/console_reporter';
import {MultiReporter} from './reporter/multi_reporter';
import {RegressionSlopeValidator} from './validator/regression_slope_validator';
import {SizeValidator} from './validator/size_validator';
import {Validator} from './validator';
import {PerflogMetric} from './metric/perflog_metric';
import {MultiMetric} from './metric/multi_metric';
import {UserMetric} from './metric/user_metric';
import {ChromeDriverExtension} from './webdriver/chrome_driver_extension';
import {FirefoxDriverExtension} from './webdriver/firefox_driver_extension';
import {IOsDriverExtension} from './webdriver/ios_driver_extension';
import {WebDriverExtension} from './web_driver_extension';
import {SampleDescription} from './sample_description';
import {WebDriverAdapter} from './web_driver_adapter';
import {Reporter} from './reporter';
import {Metric} from './metric';
import {Options} from './common_options';

/**
 * The Runner is the main entry point for executing a sample run.
 * It provides defaults, creates the injector and calls the sampler.
 */
export class Runner {
  private _defaultProviders: any[];
  constructor(defaultProviders: any[] = null) {
    if (isBlank(defaultProviders)) {
      defaultProviders = [];
    }
    this._defaultProviders = defaultProviders;
  }

  sample({id, execute, prepare, microMetrics, providers, userMetrics}:
             {id: string, execute?: any, prepare?: any, microMetrics?: any, providers?: any, userMetrics?: any}):
      Promise<SampleState> {
    var sampleProviders = [
      _DEFAULT_PROVIDERS,
      this._defaultProviders,
      {provide: Options.SAMPLE_ID, useValue: id},
      {provide: Options.EXECUTE, useValue: execute}
    ];
    if (isPresent(prepare)) {
      sampleProviders.push({provide: Options.PREPARE, useValue: prepare});
    }
    if (isPresent(microMetrics)) {
      sampleProviders.push({provide: Options.MICRO_METRICS, useValue: microMetrics});
    }
    if (isPresent(userMetrics)) {
      sampleProviders.push({provide: Options.USER_METRICS, useValue: userMetrics});
    }
    if (isPresent(providers)) {
      sampleProviders.push(providers);
    }

    var inj = ReflectiveInjector.resolveAndCreate(sampleProviders);
    var adapter = inj.get(WebDriverAdapter);

    return PromiseWrapper
        .all([adapter.capabilities(), adapter.executeScript('return window.navigator.userAgent;')])
        .then((args) => {
          var capabilities = args[0];
          var userAgent = args[1];

          // This might still create instances twice. We are creating a new injector with all the
          // providers.
          // Only WebDriverAdapter is reused.
          // TODO vsavkin consider changing it when toAsyncFactory is added back or when child
          // injectors are handled better.
          var injector = ReflectiveInjector.resolveAndCreate([
            sampleProviders,
            {provide: Options.CAPABILITIES, useValue: capabilities},
            {provide: Options.USER_AGENT, useValue: userAgent},
            {provide: WebDriverAdapter, useValue: adapter}
          ]);

          var sampler = injector.get(Sampler);
          return sampler.sample();
        });
  }
}

var _DEFAULT_PROVIDERS = [
  Options.DEFAULT_PROVIDERS,
  Sampler.PROVIDERS,
  ConsoleReporter.PROVIDERS,
  RegressionSlopeValidator.PROVIDERS,
  SizeValidator.PROVIDERS,
  ChromeDriverExtension.PROVIDERS,
  FirefoxDriverExtension.PROVIDERS,
  IOsDriverExtension.PROVIDERS,
  PerflogMetric.PROVIDERS,
  UserMetric.BINDINGS,
  SampleDescription.PROVIDERS,
  MultiReporter.createBindings([ConsoleReporter]),
  MultiMetric.createBindings([PerflogMetric, UserMetric]),
  Reporter.bindTo(MultiReporter),
  Validator.bindTo(RegressionSlopeValidator),
  WebDriverExtension.bindTo([ChromeDriverExtension, FirefoxDriverExtension, IOsDriverExtension]),
  Metric.bindTo(MultiMetric),
];
