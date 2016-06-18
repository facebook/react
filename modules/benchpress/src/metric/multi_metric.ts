import {Injector, OpaqueToken} from '@angular/core/src/di';
import {StringMapWrapper} from '@angular/facade';
import {PromiseWrapper} from '@angular/facade';

import {Metric} from '../metric';

export class MultiMetric extends Metric {
  static createBindings(childTokens: any[]): any[] {
    return [
      {
        provide: _CHILDREN,
        useFactory:(injector: Injector) => childTokens.map(token => injector.get(token)),
        deps: [Injector]
      },
      {
        provide: MultiMetric,
        useFactory: children => new MultiMetric(children),
        deps: [_CHILDREN]
      }
    ];
  }

  constructor(private _metrics: Metric[]) { super(); }

  /**
   * Starts measuring
   */
  beginMeasure(): Promise<any> {
    return PromiseWrapper.all(this._metrics.map(metric => metric.beginMeasure()));
  }

  /**
   * Ends measuring and reports the data
   * since the begin call.
   * @param restart: Whether to restart right after this.
   */
  endMeasure(restart: boolean): Promise<{[key: string]: any}> {
    return PromiseWrapper.all(this._metrics.map(metric => metric.endMeasure(restart)))
        .then(values => mergeStringMaps(values));
  }

  /**
   * Describes the metrics provided by this metric implementation.
   * (e.g. units, ...)
   */
  describe(): {[key: string]: any} {
    return mergeStringMaps(this._metrics.map((metric) => metric.describe()));
  }
}

function mergeStringMaps(maps: { [key: string]: string }[]): Object {
  var result = {};
  maps.forEach(
      map => { StringMapWrapper.forEach(map, (value, prop) => { result[prop] = value; }); });
  return result;
}

var _CHILDREN = new OpaqueToken('MultiMetric.children');
