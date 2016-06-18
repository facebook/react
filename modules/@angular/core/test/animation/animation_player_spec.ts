import {AnimationPlayer, NoOpAnimationPlayer} from '../../src/animation/animation_player';
import {fakeAsync, flushMicrotasks} from '../../testing';
import {AsyncTestCompleter, beforeEach, ddescribe, describe, expect, iit, inject, it, xdescribe, xit} from '../../testing/testing_internal';

export function main() {
  describe('NoOpAnimationPlayer', function() {
    it('should call onDone after the next microtask when constructed', fakeAsync(() => {
         var player = new NoOpAnimationPlayer();
         var completed = false;
         player.onDone(() => completed = true);
         expect(completed).toEqual(false);
         flushMicrotasks();
         expect(completed).toEqual(true);
       }));

    it('should be able to run each of the player methods', fakeAsync(() => {
         var player = new NoOpAnimationPlayer();
         player.pause();
         player.play();
         player.finish();
         player.restart();
         player.destroy();
       }));
  });
}
