import {print, isPresent, isBlank, NumberWrapper} from '@angular/facade';
import {StringMapWrapper, ListWrapper} from '@angular/facade';
import {PromiseWrapper} from '@angular/facade';
import {Math} from '@angular/facade';
import {OpaqueToken} from '@angular/core/src/di';

import {Statistic} from '../statistic';
import {Reporter} from '../reporter';
import {SampleDescription} from '../sample_description';
import {MeasureValues} from '../measure_values';

/**
 * A reporter for the console
 */
export class ConsoleReporter extends Reporter {
  // TODO(tbosch): use static values when our transpiler supports them
  static get PRINT(): OpaqueToken { return _PRINT; }
  // TODO(tbosch): use static values when our transpiler supports them
  static get COLUMN_WIDTH(): OpaqueToken { return _COLUMN_WIDTH; }
  // TODO(tbosch): use static values when our transpiler supports them
  static get PROVIDERS(): any[] { return _PROVIDERS; }


  static _lpad(value, columnWidth, fill = ' ') {
    var result = '';
    for (var i = 0; i < columnWidth - value.length; i++) {
      result += fill;
    }
    return result + value;
  }

  static _formatNum(n) { return NumberWrapper.toFixed(n, 2); }

  static _sortedProps(obj) {
    var props = [];
    StringMapWrapper.forEach(obj, (value, prop) => props.push(prop));
    props.sort();
    return props;
  }

  private _metricNames: string[];

  constructor(private _columnWidth: number, sampleDescription, private _print: Function) {
    super();
    this._metricNames = ConsoleReporter._sortedProps(sampleDescription.metrics);
    this._printDescription(sampleDescription);
  }

  _printDescription(sampleDescription) {
    this._print(`BENCHMARK ${sampleDescription.id}`);
    this._print('Description:');
    var props = ConsoleReporter._sortedProps(sampleDescription.description);
    props.forEach((prop) => { this._print(`- ${prop}: ${sampleDescription.description[prop]}`); });
    this._print('Metrics:');
    this._metricNames.forEach((metricName) => {
      this._print(`- ${metricName}: ${sampleDescription.metrics[metricName]}`);
    });
    this._print('');
    this._printStringRow(this._metricNames);
    this._printStringRow(this._metricNames.map((_) => ''), '-');
  }

  reportMeasureValues(measureValues: MeasureValues): Promise<any> {
    var formattedValues = this._metricNames.map(metricName => {
      var value = measureValues.values[metricName];
      return ConsoleReporter._formatNum(value);
    });
    this._printStringRow(formattedValues);
    return PromiseWrapper.resolve(null);
  }

  reportSample(completeSample: MeasureValues[], validSamples: MeasureValues[]): Promise<any> {
    this._printStringRow(this._metricNames.map((_) => ''), '=');
    this._printStringRow(this._metricNames.map(metricName => {
      var samples = validSamples.map(measureValues => measureValues.values[metricName]);
      var mean = Statistic.calculateMean(samples);
      var cv = Statistic.calculateCoefficientOfVariation(samples, mean);
      var formattedMean = ConsoleReporter._formatNum(mean)
                              // Note: Don't use the unicode character for +- as it might cause
                              // hickups for consoles...
                              return NumberWrapper.isNaN(cv) ?
                              formattedMean :
                              `${formattedMean}+-${Math.floor(cv)}%`;
    }));
    return PromiseWrapper.resolve(null);
  }

  _printStringRow(parts: any[], fill = ' ') {
    this._print(
        parts.map(part => ConsoleReporter._lpad(part, this._columnWidth, fill)).join(' | '));
  }
}

var _PRINT = new OpaqueToken('ConsoleReporter.print');
var _COLUMN_WIDTH = new OpaqueToken('ConsoleReporter.columnWidth');
var _PROVIDERS = [
  {
    provide: ConsoleReporter,
    useFactory: (columnWidth, sampleDescription, print) =>
                     new ConsoleReporter(columnWidth, sampleDescription, print),
    deps: [_COLUMN_WIDTH, SampleDescription, _PRINT]
  },
  {provide: _COLUMN_WIDTH, useValue: 18},
  {provide: _PRINT, useValue: print}
];
