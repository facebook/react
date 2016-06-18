import {isPresent, scheduleMicroTask} from '../facade/lang';

import {AnimationPlayer, NoOpAnimationPlayer} from './animation_player';

export class AnimationSequencePlayer implements AnimationPlayer {
  private _currentIndex: number = 0;
  private _activePlayer: AnimationPlayer;
  private _subscriptions: Function[] = [];
  private _finished = false;

  public parentPlayer: AnimationPlayer = null;

  constructor(private _players: AnimationPlayer[]) {
    this._players.forEach(player => { player.parentPlayer = this; });
    this._onNext(false);
  }

  private _onNext(start: boolean) {
    if (this._finished) return;

    if (this._players.length == 0) {
      this._activePlayer = new NoOpAnimationPlayer();
      scheduleMicroTask(() => this._onFinish());
    } else if (this._currentIndex >= this._players.length) {
      this._activePlayer = new NoOpAnimationPlayer();
      this._onFinish();
    } else {
      var player = this._players[this._currentIndex++];
      player.onDone(() => this._onNext(true));

      this._activePlayer = player;
      if (start) {
        player.play();
      }
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

  play(): void { this._activePlayer.play(); }

  pause(): void { this._activePlayer.pause(); }

  restart(): void {
    if (this._players.length > 0) {
      this.reset();
      this._players[0].restart();
    }
  }

  reset(): void { this._players.forEach(player => player.reset()); }

  finish(): void {
    this._onFinish();
    this._players.forEach(player => player.finish());
  }

  destroy(): void {
    this._onFinish();
    this._players.forEach(player => player.destroy());
  }

  setPosition(p: any /** TODO #9100 */): void { this._players[0].setPosition(p); }

  getPosition(): number { return this._players[0].getPosition(); }
}
