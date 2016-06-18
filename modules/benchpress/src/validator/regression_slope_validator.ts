import {ListWrapper} from '@angular/facade';
import {OpaqueToken} from '@angular/core/src/di';

import {Validator} from '../validator';
import {Statistic} from '../statistic';
import {MeasureValues} from '../measure_values';

/**
 * A validator that checks the regression slope of a specific metric.
 * Waits for the regression slope to be >=0.
 */
export class RegressionSlopeValidator extends Validator {
  // TODO(tbosch): use static values when our transpiler supports them
  static get SAMPLE_SIZE(): OpaqueToken { return _SAMPLE_SIZE; }
  // TODO(tbosch): use static values when our transpiler supports them
  static get METRIC(): OpaqueToken { return _METRIC; }
  // TODO(tbosch): use static values when our transpiler supports them
  static get PROVIDERS(): any[] { return _PROVIDERS; }

  _sampleSize: number;
  _metric: string;

  constructor(sampleSize, metric) {
    super();
    this._sampleSize = sampleSize;
    this._metric = metric;
  }

  describe(): {[key: string]: any} {
    return {'sampleSize': this._sampleSize, 'regressionSlopeMetric': this._metric};
  }

  validate(completeSample: MeasureValues[]): MeasureValues[] {
    if (completeSample.length >= this._sampleSize) {
      var latestSample = ListWrapper.slice(completeSample, completeSample.length - this._sampleSize,
                                           completeSample.length);
      var xValues = [];
      var yValues = [];
      for (var i = 0; i < latestSample.length; i++) {
        // For now, we only use the array index as x value.
        // TODO(tbosch): think about whether we should use time here instead
        xValues.push(i);
        yValues.push(latestSample[i].values[this._metric]);
      }
      var regressionSlope = Statistic.calculateRegressionSlope(
          xValues, Statistic.calculateMean(xValues), yValues, Statistic.calculateMean(yValues));
      return regressionSlope >= 0 ? latestSample : null;
    } else {
      return null;
    }
  }
}

var _SAMPLE_SIZE = new OpaqueToken('RegressionSlopeValidator.sampleSize');
var _METRIC = new OpaqueToken('RegressionSlopeValidator.metric');
var _PROVIDERS = [
  {
    provide: RegressionSlopeValidator
    useFactory: (sampleSize, metric) => new RegressionSlopeValidator(sampleSize, metric),
    deps: [_SAMPLE_SIZE, _METRIC]
  },
  {provide: _SAMPLE_SIZE, useValue: 10},
  {provide: _METRIC, useValue: 'scriptTime'}
];
