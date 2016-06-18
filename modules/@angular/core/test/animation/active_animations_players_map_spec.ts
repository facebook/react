import {getDOM} from '@angular/platform-browser/src/dom/dom_adapter';
import {el} from '@angular/platform-browser/testing';

import {ActiveAnimationPlayersMap} from '../../src/animation/active_animation_players_map';
import {isPresent} from '../../src/facade/lang';
import {fakeAsync, flushMicrotasks} from '../../testing';
import {MockAnimationPlayer} from '../../testing/animation/mock_animation_player';
import {AsyncTestCompleter, beforeEach, ddescribe, describe, expect, iit, inject, it, xdescribe, xit} from '../../testing/testing_internal';

export function main() {
  describe('ActiveAnimationsPlayersMap', function() {
    var playersMap: any /** TODO #9100 */;
    var elementNode: any /** TODO #9100 */;
    var animationName = 'animationName';

    beforeEach(() => {
      playersMap = new ActiveAnimationPlayersMap();
      elementNode = el('<div></div>');
    });

    afterEach(() => {
      getDOM().remove(elementNode);
      elementNode = null;
    });

    it('should register a player an allow it to be accessed', () => {
      var player = new MockAnimationPlayer();
      playersMap.set(elementNode, animationName, player);

      expect(playersMap.find(elementNode, animationName)).toBe(player);
      expect(playersMap.findAllPlayersByElement(elementNode)).toEqual([player]);
      expect(playersMap.getAllPlayers()).toEqual([player]);
      expect(playersMap.length).toEqual(1);
    });

    it('should remove a registered player when remove() is called', () => {
      var player = new MockAnimationPlayer();
      playersMap.set(elementNode, animationName, player);
      expect(playersMap.find(elementNode, animationName)).toBe(player);
      expect(playersMap.length).toEqual(1);
      playersMap.remove(elementNode, animationName);
      expect(playersMap.find(elementNode, animationName)).not.toBe(player);
      expect(playersMap.length).toEqual(0);
    });

    it('should allow multiple players to be registered on the same element', () => {
      var player1 = new MockAnimationPlayer();
      var player2 = new MockAnimationPlayer();
      playersMap.set(elementNode, 'myAnimation1', player1);
      playersMap.set(elementNode, 'myAnimation2', player2);
      expect(playersMap.length).toEqual(2);
      expect(playersMap.findAllPlayersByElement(elementNode)).toEqual([player1, player2]);
    });

    it('should only allow one player to be set for a given element/animationName pair', () => {
      var player1 = new MockAnimationPlayer();
      var player2 = new MockAnimationPlayer();
      playersMap.set(elementNode, animationName, player1);
      expect(playersMap.find(elementNode, animationName)).toBe(player1);
      expect(playersMap.length).toEqual(1);
      playersMap.set(elementNode, animationName, player2);
      expect(playersMap.find(elementNode, animationName)).toBe(player2);
      expect(playersMap.length).toEqual(1);
    });
  });
}
