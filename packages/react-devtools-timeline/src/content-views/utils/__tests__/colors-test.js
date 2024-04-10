/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {hslaColorToString, dimmedColor, ColorGenerator} from '../colors';

describe(hslaColorToString, () => {
  it('should transform colors to strings', () => {
    expect(hslaColorToString({h: 1, s: 2, l: 3, a: 4})).toEqual(
      'hsl(1deg 2% 3% / 4)',
    );
    expect(hslaColorToString({h: 3.14, s: 6.28, l: 1.68, a: 100})).toEqual(
      'hsl(3.14deg 6.28% 1.68% / 100)',
    );
  });
});

describe(dimmedColor, () => {
  it('should dim luminosity using delta', () => {
    expect(dimmedColor({h: 1, s: 2, l: 3, a: 4}, 3)).toEqual({
      h: 1,
      s: 2,
      l: 0,
      a: 4,
    });
    expect(dimmedColor({h: 1, s: 2, l: 3, a: 4}, -3)).toEqual({
      h: 1,
      s: 2,
      l: 6,
      a: 4,
    });
  });
});

describe(ColorGenerator, () => {
  describe(ColorGenerator.prototype.colorForID, () => {
    it('should generate a color for an ID', () => {
      expect(new ColorGenerator().colorForID('123')).toMatchInlineSnapshot(`
        {
          "a": 1,
          "h": 190,
          "l": 80,
          "s": 67,
        }
      `);
    });

    it('should generate colors deterministically given an ID', () => {
      expect(new ColorGenerator().colorForID('id1')).toEqual(
        new ColorGenerator().colorForID('id1'),
      );
      expect(new ColorGenerator().colorForID('id2')).toEqual(
        new ColorGenerator().colorForID('id2'),
      );
    });

    it('should generate different colors for different IDs', () => {
      expect(new ColorGenerator().colorForID('id1')).not.toEqual(
        new ColorGenerator().colorForID('id2'),
      );
    });

    it('should return colors that have been set manually', () => {
      const generator = new ColorGenerator();
      const manualColor = {h: 1, s: 2, l: 3, a: 4};
      generator.setColorForID('id with set color', manualColor);
      expect(generator.colorForID('id with set color')).toEqual(manualColor);
      expect(generator.colorForID('some other id')).not.toEqual(manualColor);
    });

    it('should generate colors from fixed color spaces', () => {
      const generator = new ColorGenerator(1, 2, 3, 4);
      expect(generator.colorForID('123')).toEqual({h: 1, s: 2, l: 3, a: 4});
      expect(generator.colorForID('234')).toEqual({h: 1, s: 2, l: 3, a: 4});
    });

    it('should generate colors from range color spaces', () => {
      const generator = new ColorGenerator(
        {min: 0, max: 360, count: 2},
        2,
        3,
        4,
      );
      expect(generator.colorForID('123')).toEqual({h: 0, s: 2, l: 3, a: 4});
      expect(generator.colorForID('234')).toEqual({h: 360, s: 2, l: 3, a: 4});
    });
  });
});
