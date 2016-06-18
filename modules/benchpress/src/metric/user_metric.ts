import {bind, Provider, OpaqueToken} from 'angular2/src/core/di';
import {PromiseWrapper, TimerWrapper} from 'angular2/src/facade/async';
import {StringMapWrapper} from 'angular2/src/facade/collection';
import {isNumber} from 'angular2/src/facade/lang';

import {Metric} from '../metric';
import {Options} from '../common_options';
import {WebDriverAdapter} from '../web_driver_adapter';

export class UserMetric extends Metric {
  // TODO(tbosch): use static values when our transpiler supports them
  static get PROVIDERS(): Provider[] { return _PROVIDERS; }

  constructor(private _userMetrics: {[key: string]: string}, private _wdAdapter: WebDriverAdapter) {
    super();
  }

  /**
   * Starts measuring
   */
  beginMeasure(): Promise<any> { return PromiseWrapper.resolve(true); }

  /**
   * Ends measuring.
   */
  endMeasure(restart: boolean): Promise<{[key: string]: any}> {
    let completer = PromiseWrapper.completer<{[key: string]: any}>();
    let adapter = this._wdAdapter;
    let names = StringMapWrapper.keys(this._userMetrics);

    function getAndClearValues() {
      PromiseWrapper.all(names.map(name => adapter.executeScript(`return window.${name}`)))
          .then((values: any[]) => {
            if (values.every(isNumber)) {
              PromiseWrapper.all(names.map(name => adapter.executeScript(`delete window.${name}`)))
                  .then((_: any[]) => {
                    let map = StringMapWrapper.create();
                    for (let i = 0, n = names.length; i < n; i++) {
                      StringMapWrapper.set(map, names[i], values[i]);
                    }
                    completer.resolve(map);
                  }, completer.reject);
            } else {
              TimerWrapper.setTimeout(getAndClearValues, 100);
            }
          }, completer.reject);
    }
    getAndClearValues();
    return completer.promise;
  }

  /**
   * Describes the metrics provided by this metric implementation.
   * (e.g. units, ...)
   */
  describe(): {[key: string]: any} { return this._userMetrics; }
}

var _PROVIDERS = [
  bind(UserMetric)
      .toFactory((userMetrics, wdAdapter) => new UserMetric(userMetrics, wdAdapter),
                 [Options.USER_METRICS, WebDriverAdapter])
];
