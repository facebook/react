import {isPresent, scheduleMicroTask} from '../facade/lang';
import {Math} from '../facade/math';

import {AnimationPlayer} from './animation_player';

export class AnimationGroupPlayer implements AnimationPlayer {
  private _subscriptions: Function[] = [];
  private _finished = false;
  public parentPlayer: AnimationPlayer = null;

  constructor(private _players: AnimationPlayer[]) {
    var count = 0;
    var total = this._players.length;
    if (total == 0) {
      scheduleMicroTask(() => this._onFinish());
    } else {
      this._players.forEach(player => {
        player.parentPlayer = this;
        player.onDone(() => {
          if (++count >= total) {
            this._onFinish();
          }
        });
      });
    }
  }

  private _onFinish() {
    if (!this._finished) {
      this._finished = true;
      if (!isPresent(this.parentPlayer)) {
        this.destroy();
      }
      this._subscriptions.forEach(subscription => subscription());
      this._subscriptions = [];
    }
  }

  onDone(fn: Function): void { this._subscriptions.push(fn); }

  play() { this._players.forEach(player => player.play()); }

  pause(): void { this._players.forEach(player => player.pause()); }

  restart(): void { this._players.forEach(player => player.restart()); }

  finish(): void {
    this._onFinish();
    this._players.forEach(player => player.finish());
  }

  destroy(): void {
    this._onFinish();
    this._players.forEach(player => player.destroy());
  }

  reset(): void { this._players.forEach(player => player.reset()); }

  setPosition(p: any /** TODO #9100 */): void {
    this._players.forEach(player => { player.setPosition(p); });
  }

  getPosition(): number {
    var min = 0;
    this._players.forEach(player => {
      var p = player.getPosition();
      min = Math.min(p, min);
    });
    return min;
  }
}
