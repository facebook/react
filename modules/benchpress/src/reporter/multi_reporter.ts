import {Injector, OpaqueToken} from '@angular/core/src/di';
import {PromiseWrapper} from '@angular/facade';

import {MeasureValues} from '../measure_values';
import {Reporter} from '../reporter';

export class MultiReporter extends Reporter {
  static createBindings(childTokens: any[]): any[] {
    return [
      {
        provide: _CHILDREN,
        useFactory: (injector: Injector) => childTokens.map(token => injector.get(token)),
        deps: [Injector],
      },
      {provide: MultiReporter, useFactory: children => new MultiReporter(children), deps: [_CHILDREN]}
    ];
  }

  _reporters: Reporter[];

  constructor(reporters) {
    super();
    this._reporters = reporters;
  }

  reportMeasureValues(values: MeasureValues): Promise<any[]> {
    return PromiseWrapper.all(
        this._reporters.map(reporter => reporter.reportMeasureValues(values)));
  }

  reportSample(completeSample: MeasureValues[], validSample: MeasureValues[]): Promise<any[]> {
    return PromiseWrapper.all(
        this._reporters.map(reporter => reporter.reportSample(completeSample, validSample)));
  }
}

var _CHILDREN = new OpaqueToken('MultiReporter.children');
