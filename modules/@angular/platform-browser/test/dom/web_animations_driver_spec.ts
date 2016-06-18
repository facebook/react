import {AsyncTestCompleter, beforeEach, beforeEachProviders, ddescribe, describe, expect, iit, inject, it, xdescribe, xit} from '@angular/core/testing/testing_internal';
import {el} from '@angular/platform-browser/testing';

import {AnimationKeyframe, AnimationStyles} from '../../core_private';
import {DomAnimatePlayer} from '../../src/dom/dom_animate_player';
import {WebAnimationsDriver} from '../../src/dom/web_animations_driver';
import {MockDomAnimatePlayer} from '../../testing/mock_dom_animate_player';

class ExtendedWebAnimationsDriver extends WebAnimationsDriver {
  public log: {[key: string]: any}[] = [];

  constructor() { super(); }

  _triggerWebAnimation(elm: any, keyframes: any[], options: any): DomAnimatePlayer {
    this.log.push({'elm': elm, 'keyframes': keyframes, 'options': options});
    return new MockDomAnimatePlayer();
  }
}

function _makeStyles(styles: {[key: string]: string | number}): AnimationStyles {
  return new AnimationStyles([styles]);
}

function _makeKeyframe(
    offset: number, styles: {[key: string]: string | number}): AnimationKeyframe {
  return new AnimationKeyframe(offset, _makeStyles(styles));
}

export function main() {
  describe('WebAnimationsDriver', () => {
    var driver: ExtendedWebAnimationsDriver;
    var elm: HTMLElement;
    beforeEach(() => {
      driver = new ExtendedWebAnimationsDriver();
      elm = el('<div></div>');
    });

    it('should convert all styles to camelcase', () => {
      var startingStyles = _makeStyles({'border-top-right': '40px'});
      var styles = [
        _makeKeyframe(0, {'max-width': '100px', 'height': '200px'}),
        _makeKeyframe(1, {'font-size': '555px'})
      ];

      driver.animate(elm, startingStyles, styles, 0, 0, 'linear');
      var details = driver.log.pop();
      var startKeyframe = details['keyframes'][0];
      var firstKeyframe = details['keyframes'][1];
      var lastKeyframe = details['keyframes'][2];

      expect(startKeyframe['borderTopRight']).toEqual('40px');

      expect(firstKeyframe['maxWidth']).toEqual('100px');
      expect(firstKeyframe['max-width']).toBeFalsy();
      expect(firstKeyframe['height']).toEqual('200px');

      expect(lastKeyframe['fontSize']).toEqual('555px');
      expect(lastKeyframe['font-size']).toBeFalsy();
    });

    it('should auto prefix numeric properties with a `px` value', () => {
      var startingStyles = _makeStyles({'borderTopWidth': 40});
      var styles = [_makeKeyframe(0, {'font-size': 100}), _makeKeyframe(1, {'height': '555em'})];

      driver.animate(elm, startingStyles, styles, 0, 0, 'linear');
      var details = driver.log.pop();
      var startKeyframe = details['keyframes'][0];
      var firstKeyframe = details['keyframes'][1];
      var lastKeyframe = details['keyframes'][2];

      expect(startKeyframe['borderTopWidth']).toEqual('40px');

      expect(firstKeyframe['fontSize']).toEqual('100px');

      expect(lastKeyframe['height']).toEqual('555em');
    });
  });
}
