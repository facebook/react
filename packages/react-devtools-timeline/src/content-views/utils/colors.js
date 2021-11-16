/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

type ColorSpace = number | {|min: number, max: number, count?: number|};

// Docstrings from https://www.w3schools.com/css/css_colors_hsl.asp
type HslaColor = $ReadOnly<{|
  /** Hue is a degree on the color wheel from 0 to 360. 0 is red, 120 is green, and 240 is blue. */
  h: number,
  /** Saturation is a percentage value, 0% means a shade of gray, and 100% is the full color. */
  s: number,
  /** Lightness is a percentage, 0% is black, 50% is neither light or dark, 100% is white. */
  l: number,
  /** Alpha is a percentage, 0% is fully transparent, and 100 is not transparent at all. */
  a: number,
|}>;

export function hslaColorToString({h, s, l, a}: HslaColor): string {
  return `hsl(${h}deg ${s}% ${l}% / ${a})`;
}

export function dimmedColor(color: HslaColor, dimDelta: number): HslaColor {
  return {
    ...color,
    l: color.l - dimDelta,
  };
}

// Source: https://source.chromium.org/chromium/chromium/src/+/master:out/Debug/gen/devtools/platform/utilities.js;l=120
function hashCode(string: string): number {
  // Hash algorithm for substrings is described in "Über die Komplexität der Multiplikation in
  // eingeschränkten Branchingprogrammmodellen" by Woelfe.
  // http://opendatastructures.org/versions/edition-0.1d/ods-java/node33.html#SECTION00832000000000000000
  const p = (1 << 30) * 4 - 5; // prime: 2^32 - 5
  const z = 0x5033d967; // 32 bits from random.org
  const z2 = 0x59d2f15d; // random odd 32 bit number
  let s = 0;
  let zi = 1;
  for (let i = 0; i < string.length; i++) {
    const xi = string.charCodeAt(i) * z2;
    s = (s + zi * xi) % p;
    zi = (zi * z) % p;
  }
  s = (s + zi * (p - 1)) % p;
  return Math.abs(s | 0);
}

function indexToValueInSpace(index: number, space: ColorSpace): number {
  if (typeof space === 'number') {
    return space;
  }
  const count = space.count || space.max - space.min;
  index %= count;
  return (
    space.min + Math.floor((index / (count - 1)) * (space.max - space.min))
  );
}

/**
 * Deterministic color generator.
 *
 * Adapted from: https://source.chromium.org/chromium/chromium/src/+/master:out/Debug/gen/devtools/common/Color.js
 */
export class ColorGenerator {
  _hueSpace: ColorSpace;
  _satSpace: ColorSpace;
  _lightnessSpace: ColorSpace;
  _alphaSpace: ColorSpace;
  _colors: Map<string, HslaColor>;

  constructor(
    hueSpace?: ColorSpace,
    satSpace?: ColorSpace,
    lightnessSpace?: ColorSpace,
    alphaSpace?: ColorSpace,
  ) {
    this._hueSpace = hueSpace || {min: 0, max: 360};
    this._satSpace = satSpace || 67;
    this._lightnessSpace = lightnessSpace || 80;
    this._alphaSpace = alphaSpace || 1;
    this._colors = new Map();
  }

  setColorForID(id: string, color: HslaColor) {
    this._colors.set(id, color);
  }

  colorForID(id: string): HslaColor {
    const cachedColor = this._colors.get(id);
    if (cachedColor) {
      return cachedColor;
    }
    const color = this._generateColorForID(id);
    this._colors.set(id, color);
    return color;
  }

  _generateColorForID(id: string): HslaColor {
    const hash = hashCode(id);
    return {
      h: indexToValueInSpace(hash, this._hueSpace),
      s: indexToValueInSpace(hash >> 8, this._satSpace),
      l: indexToValueInSpace(hash >> 16, this._lightnessSpace),
      a: indexToValueInSpace(hash >> 24, this._alphaSpace),
    };
  }
}
