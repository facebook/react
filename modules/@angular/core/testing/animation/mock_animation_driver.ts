import {AnimationDriver} from '../../src/animation/animation_driver';
import {AnimationKeyframe} from '../../src/animation/animation_keyframe';
import {AnimationPlayer} from '../../src/animation/animation_player';
import {AnimationStyles} from '../../src/animation/animation_styles';
import {StringMapWrapper} from '../../src/facade/collection';
import {MockAnimationPlayer} from '../../testing/animation/mock_animation_player';

export class MockAnimationDriver extends AnimationDriver {
  log: any[] /** TODO #9100 */ = [];
  animate(
      element: any, startingStyles: AnimationStyles, keyframes: AnimationKeyframe[],
      duration: number, delay: number, easing: string): AnimationPlayer {
    var player = new MockAnimationPlayer();
    this.log.push({
      'element': element,
      'startingStyles': _serializeStyles(startingStyles),
      'keyframes': keyframes,
      'keyframeLookup': _serializeKeyframes(keyframes),
      'duration': duration,
      'delay': delay,
      'easing': easing,
      'player': player
    });
    return player;
  }
}

function _serializeKeyframes(keyframes: AnimationKeyframe[]): any[] {
  return keyframes.map(keyframe => [keyframe.offset, _serializeStyles(keyframe.styles)]);
}

function _serializeStyles(styles: AnimationStyles): {[key: string]: any} {
  var flatStyles = {};
  styles.styles.forEach(
      entry => StringMapWrapper.forEach(
          entry, (val: any /** TODO #9100 */, prop: any /** TODO #9100 */) => {
            (flatStyles as any /** TODO #9100 */)[prop] = val;
          }));
  return flatStyles;
}
