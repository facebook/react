/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * CSS properties which accept numbers but are not in units of "px".
 */
export default function (name: string): boolean {
  switch (name) {
    case 'animationIterationCount':
    case 'aspectRatio':
    case 'borderImageOutset':
    case 'borderImageSlice':
    case 'borderImageWidth':
    case 'boxFlex':
    case 'boxFlexGroup':
    case 'boxOrdinalGroup':
    case 'columnCount':
    case 'columns':
    case 'flex':
    case 'flexGrow':
    case 'flexPositive':
    case 'flexShrink':
    case 'flexNegative':
    case 'flexOrder':
    case 'gridArea':
    case 'gridRow':
    case 'gridRowEnd':
    case 'gridRowSpan':
    case 'gridRowStart':
    case 'gridColumn':
    case 'gridColumnEnd':
    case 'gridColumnSpan':
    case 'gridColumnStart':
    case 'fontWeight':
    case 'lineClamp':
    case 'lineHeight':
    case 'opacity':
    case 'order':
    case 'orphans':
    case 'scale':
    case 'tabSize':
    case 'widows':
    case 'zIndex':
    case 'zoom':
    case 'fillOpacity': // SVG-related properties
    case 'floodOpacity':
    case 'stopOpacity':
    case 'strokeDasharray':
    case 'strokeDashoffset':
    case 'strokeMiterlimit':
    case 'strokeOpacity':
    case 'strokeWidth':
    case 'MozAnimationIterationCount': // Known Prefixed Properties
    case 'MozBoxFlex': // TODO: Remove these since they shouldn't be used in modern code
    case 'MozBoxFlexGroup':
    case 'MozLineClamp':
    case 'msAnimationIterationCount':
    case 'msFlex':
    case 'msZoom':
    case 'msFlexGrow':
    case 'msFlexNegative':
    case 'msFlexOrder':
    case 'msFlexPositive':
    case 'msFlexShrink':
    case 'msGridColumn':
    case 'msGridColumnSpan':
    case 'msGridRow':
    case 'msGridRowSpan':
    case 'WebkitAnimationIterationCount':
    case 'WebkitBoxFlex':
    case 'WebKitBoxFlexGroup':
    case 'WebkitBoxOrdinalGroup':
    case 'WebkitColumnCount':
    case 'WebkitColumns':
    case 'WebkitFlex':
    case 'WebkitFlexGrow':
    case 'WebkitFlexPositive':
    case 'WebkitFlexShrink':
    case 'WebkitLineClamp':
      return true;
    default:
      return false;
  }
}
