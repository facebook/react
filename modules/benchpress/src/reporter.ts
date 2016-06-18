import {BaseException, WrappedException} from '@angular/facade';
import {MeasureValues} from './measure_values';

/**
 * A reporter reports measure values and the valid sample.
 */
export abstract class Reporter {
  static bindTo(delegateToken): any[] {
    return [{provide: Reporter, useFactory: (delegate) => delegate, deps: [delegateToken]}];
  }

  reportMeasureValues(values: MeasureValues): Promise<any> { throw new BaseException('NYI'); }

  reportSample(completeSample: MeasureValues[], validSample: MeasureValues[]): Promise<any> {
    throw new BaseException('NYI');
  }
}
