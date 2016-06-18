import {AnimationSequencePlayer} from '../../src/animation/animation_sequence_player';
import {isPresent} from '../../src/facade/lang';
import {fakeAsync, flushMicrotasks} from '../../testing';
import {MockAnimationPlayer} from '../../testing/animation/mock_animation_player';
import {AsyncTestCompleter, beforeEach, ddescribe, describe, expect, iit, inject, it, xdescribe, xit} from '../../testing/testing_internal';

export function main() {
  describe('AnimationSequencePlayer', function() {
    var players: any /** TODO #9100 */;
    beforeEach(() => {
      players = [
        new MockAnimationPlayer(),
        new MockAnimationPlayer(),
        new MockAnimationPlayer(),
      ];
    });

    var assertLastStatus =
        (player: MockAnimationPlayer, status: string, match: boolean, iOffset: number = 0) => {
          var index = player.log.length - 1 + iOffset;
          var actual = player.log.length > 0 ? player.log[index] : null;
          if (match) {
            expect(actual).toEqual(status);
          } else {
            expect(actual).not.toEqual(status);
          }
        }

    var assertPlaying = (player: MockAnimationPlayer, isPlaying: boolean) => {
      assertLastStatus(player, 'play', isPlaying);
    };

    it('should pause/play the active player', () => {
      var sequence = new AnimationSequencePlayer(players);

      assertPlaying(players[0], false);
      assertPlaying(players[1], false);
      assertPlaying(players[2], false);

      sequence.play();

      assertPlaying(players[0], true);
      assertPlaying(players[1], false);
      assertPlaying(players[2], false);

      sequence.pause();

      assertPlaying(players[0], false);
      assertPlaying(players[1], false);
      assertPlaying(players[2], false);

      sequence.play();
      players[0].finish();

      assertPlaying(players[0], false);
      assertPlaying(players[1], true);
      assertPlaying(players[2], false);

      players[1].finish();

      assertPlaying(players[0], false);
      assertPlaying(players[1], false);
      assertPlaying(players[2], true);

      players[2].finish();
      sequence.pause();

      assertPlaying(players[0], false);
      assertPlaying(players[1], false);
      assertPlaying(players[2], false);
    });

    it('should finish when all players have finished', () => {
      var sequence = new AnimationSequencePlayer(players);

      var completed = false;
      sequence.onDone(() => completed = true);
      sequence.play();

      expect(completed).toBeFalsy();

      players[0].finish();

      expect(completed).toBeFalsy();

      players[1].finish();

      expect(completed).toBeFalsy();

      players[2].finish();

      expect(completed).toBeTruthy();
    });

    it('should restart all the players', () => {
      var sequence = new AnimationSequencePlayer(players);

      sequence.play();

      assertPlaying(players[0], true);
      assertPlaying(players[1], false);
      assertPlaying(players[2], false);

      players[0].finish();

      assertPlaying(players[0], false);
      assertPlaying(players[1], true);
      assertPlaying(players[2], false);

      sequence.restart();

      assertLastStatus(players[0], 'restart', true);
      assertLastStatus(players[1], 'reset', true);
      assertLastStatus(players[2], 'reset', true);
    });

    it('should finish all the players', () => {
      var sequence = new AnimationSequencePlayer(players);

      var completed = false;
      sequence.onDone(() => completed = true);

      sequence.play();

      assertLastStatus(players[0], 'finish', false);
      assertLastStatus(players[1], 'finish', false);
      assertLastStatus(players[2], 'finish', false);

      sequence.finish();

      assertLastStatus(players[0], 'finish', true, -1);
      assertLastStatus(players[1], 'finish', true, -1);
      assertLastStatus(players[2], 'finish', true, -1);

      assertLastStatus(players[0], 'destroy', true);
      assertLastStatus(players[1], 'destroy', true);
      assertLastStatus(players[2], 'destroy', true);

      expect(completed).toBeTruthy();
    });

    it('should call destroy automatically when finished if no parent player is present', () => {
      var sequence = new AnimationSequencePlayer(players);

      sequence.play();

      assertLastStatus(players[0], 'destroy', false);
      assertLastStatus(players[1], 'destroy', false);
      assertLastStatus(players[2], 'destroy', false);

      sequence.finish();

      assertLastStatus(players[0], 'destroy', true);
      assertLastStatus(players[1], 'destroy', true);
      assertLastStatus(players[2], 'destroy', true);
    });

    it('should not call destroy automatically when finished if a parent player is present', () => {
      var sequence = new AnimationSequencePlayer(players);
      var parent = new AnimationSequencePlayer([sequence, new MockAnimationPlayer()]);

      sequence.play();

      assertLastStatus(players[0], 'destroy', false);
      assertLastStatus(players[1], 'destroy', false);
      assertLastStatus(players[2], 'destroy', false);

      sequence.finish();

      assertLastStatus(players[0], 'destroy', false);
      assertLastStatus(players[1], 'destroy', false);
      assertLastStatus(players[2], 'destroy', false);

      parent.finish();

      assertLastStatus(players[0], 'destroy', true);
      assertLastStatus(players[1], 'destroy', true);
      assertLastStatus(players[2], 'destroy', true);
    });

    it('should function without any players', () => {
      var sequence = new AnimationSequencePlayer([]);
      sequence.onDone(() => {});
      sequence.pause();
      sequence.play();
      sequence.finish();
      sequence.restart();
      sequence.destroy();
    });

    it('should call onDone after the next microtask if no players are provided', fakeAsync(() => {
         var sequence = new AnimationSequencePlayer([]);
         var completed = false;
         sequence.onDone(() => completed = true);
         expect(completed).toEqual(false);
         flushMicrotasks();
         expect(completed).toEqual(true);
       }));
  });
}
