import {
  describe,
  ddescribe,
  it,
  iit,
  xit,
  expect,
  beforeEach,
  afterEach
} from '@angular/testing/testing_internal';

import {Statistic} from 'benchpress/src/statistic';

import {NaN} from '@angular/facade';

export function main() {
  describe('statistic', () => {

    it('should calculate the mean', () => {
      expect(Statistic.calculateMean([])).toBeNaN();
      expect(Statistic.calculateMean([1, 2, 3])).toBe(2.0);
    });

    it('should calculate the standard deviation', () => {
      expect(Statistic.calculateStandardDeviation([], NaN)).toBeNaN();
      expect(Statistic.calculateStandardDeviation([1], 1)).toBe(0.0);
      expect(Statistic.calculateStandardDeviation([2, 4, 4, 4, 5, 5, 7, 9], 5)).toBe(2.0);
    });

    it('should calculate the coefficient of variation', () => {
      expect(Statistic.calculateCoefficientOfVariation([], NaN)).toBeNaN();
      expect(Statistic.calculateCoefficientOfVariation([1], 1)).toBe(0.0);
      expect(Statistic.calculateCoefficientOfVariation([2, 4, 4, 4, 5, 5, 7, 9], 5)).toBe(40.0);
    });

    it('should calculate the regression slope', () => {
      expect(Statistic.calculateRegressionSlope([], NaN, [], NaN)).toBeNaN();
      expect(Statistic.calculateRegressionSlope([1], 1, [2], 2)).toBeNaN();
      expect(Statistic.calculateRegressionSlope([1, 2], 1.5, [2, 4], 3)).toBe(2.0);
    });

  });
}
