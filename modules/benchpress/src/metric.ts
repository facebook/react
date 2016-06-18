import {BaseException, WrappedException} from '@angular/facade';

/**
 * A metric is measures values
 */
export abstract class Metric {
  static bindTo(delegateToken): any[] {
    return [{provide: Metric, useFactory: (delegate) => delegate, deps: [delegateToken]}];
  }

  /**
   * Starts measuring
   */
  beginMeasure(): Promise<any> { throw new BaseException('NYI'); }

  /**
   * Ends measuring and reports the data
   * since the begin call.
   * @param restart: Whether to restart right after this.
   */
  endMeasure(restart: boolean): Promise<{[key: string]: any}> { throw new BaseException('NYI'); }

  /**
   * Describes the metrics provided by this metric implementation.
   * (e.g. units, ...)
   */
  describe(): {[key: string]: any} { throw new BaseException('NYI'); }
}
