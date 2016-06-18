import {AUTO_STYLE, BaseException} from '@angular/core';

import {AnimationDriver, AnimationKeyframe, AnimationPlayer, AnimationStyles, NoOpAnimationPlayer} from '../../core_private';
import {StringMapWrapper} from '../facade/collection';
import {StringWrapper, isNumber, isPresent} from '../facade/lang';

import {getDOM} from './dom_adapter';
import {DomAnimatePlayer} from './dom_animate_player';
import {dashCaseToCamelCase} from './util';
import {WebAnimationsPlayer} from './web_animations_player';

export class WebAnimationsDriver implements AnimationDriver {
  animate(
      element: any, startingStyles: AnimationStyles, keyframes: AnimationKeyframe[],
      duration: number, delay: number, easing: string): AnimationPlayer {
    var anyElm = <any>element;

    var formattedSteps: {[key: string]: string | number}[] = [];
    var startingStyleLookup: {[key: string]: string | number} = {};
    if (isPresent(startingStyles) && startingStyles.styles.length > 0) {
      startingStyleLookup = _populateStyles(anyElm, startingStyles, {});
      startingStyleLookup['offset'] = 0;
      formattedSteps.push(startingStyleLookup);
    }

    keyframes.forEach((keyframe: AnimationKeyframe) => {
      let data = _populateStyles(anyElm, keyframe.styles, startingStyleLookup);
      data['offset'] = keyframe.offset;
      formattedSteps.push(data);
    });

    // this is a special case when only styles are applied as an
    // animation. When this occurs we want to animate from start to
    // end with the same values. Removing the offset and having only
    // start/end values is suitable enough for the web-animations API
    if (formattedSteps.length == 1) {
      var start = formattedSteps[0];
      start['offset'] = null;
      formattedSteps = [start, start];
    }

    var player = this._triggerWebAnimation(
        anyElm, formattedSteps,
        {'duration': duration, 'delay': delay, 'easing': easing, 'fill': 'forwards'});

    return new WebAnimationsPlayer(player, duration);
  }

  /** @internal */
  _triggerWebAnimation(elm: any, keyframes: any[], options: any): DomAnimatePlayer {
    return elm.animate(keyframes, options);
  }
}

function _populateStyles(
    element: any, styles: AnimationStyles,
    defaultStyles: {[key: string]: string | number}): {[key: string]: string | number} {
  var data: {[key: string]: string | number} = {};
  styles.styles.forEach((entry) => {
    StringMapWrapper.forEach(entry, (val: any, prop: string) => {
      var formattedProp = dashCaseToCamelCase(prop);
      data[formattedProp] = val == AUTO_STYLE ?
          _computeStyle(element, formattedProp) :
          val.toString() + _resolveStyleUnit(val, prop, formattedProp);
    });
  });
  StringMapWrapper.forEach(defaultStyles, (value: string, prop: string) => {
    if (!isPresent(data[prop])) {
      data[prop] = value;
    }
  });
  return data;
}

function _resolveStyleUnit(
    val: string | number, userProvidedProp: string, formattedProp: string): string {
  var unit = '';
  if (_isPixelDimensionStyle(formattedProp) && val != 0 && val != '0') {
    if (isNumber(val)) {
      unit = 'px';
    } else if (_findDimensionalSuffix(val.toString()).length == 0) {
      throw new BaseException(
          'Please provide a CSS unit value for ' + userProvidedProp + ':' + val);
    }
  }
  return unit;
}

const _$0 = 48;
const _$9 = 57;
const _$PERIOD = 46;

function _findDimensionalSuffix(value: string): string {
  for (var i = 0; i < value.length; i++) {
    var c = StringWrapper.charCodeAt(value, i);
    if ((c >= _$0 && c <= _$9) || c == _$PERIOD) continue;
    return value.substring(i, value.length);
  }
  return '';
}

function _isPixelDimensionStyle(prop: string): boolean {
  switch (prop) {
    case 'width':
    case 'height':
    case 'minWidth':
    case 'minHeight':
    case 'maxWidth':
    case 'maxHeight':
    case 'left':
    case 'top':
    case 'bottom':
    case 'right':
    case 'fontSize':
    case 'outlineWidth':
    case 'outlineOffset':
    case 'paddingTop':
    case 'paddingLeft':
    case 'paddingBottom':
    case 'paddingRight':
    case 'marginTop':
    case 'marginLeft':
    case 'marginBottom':
    case 'marginRight':
    case 'borderRadius':
    case 'borderWidth':
    case 'borderTopWidth':
    case 'borderLeftWidth':
    case 'borderRightWidth':
    case 'borderBottomWidth':
    case 'textIndent':
      return true;

    default:
      return false;
  }
}

function _computeStyle(element: any, prop: string): string {
  return getDOM().getComputedStyle(element)[prop];
}
