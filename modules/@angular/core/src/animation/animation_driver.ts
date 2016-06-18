import {AnimationKeyframe} from './animation_keyframe';
import {AnimationPlayer, NoOpAnimationPlayer} from './animation_player';
import {AnimationStyles} from './animation_styles';

export abstract class AnimationDriver {
  abstract animate(
      element: any, startingStyles: AnimationStyles, keyframes: AnimationKeyframe[],
      duration: number, delay: number, easing: string): AnimationPlayer;
}

export class NoOpAnimationDriver extends AnimationDriver {
  animate(
      element: any, startingStyles: AnimationStyles, keyframes: AnimationKeyframe[],
      duration: number, delay: number, easing: string): AnimationPlayer {
    return new NoOpAnimationPlayer();
  }
}
