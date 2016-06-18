import {AnimationPlayer} from '../../core_private';
import {isPresent} from '../facade/lang';

import {DomAnimatePlayer} from './dom_animate_player';

export class WebAnimationsPlayer implements AnimationPlayer {
  private _subscriptions: Function[] = [];
  private _finished = false;
  public parentPlayer: AnimationPlayer = null;

  constructor(private _player: DomAnimatePlayer, public totalTime: number) {
    // this is required to make the player startable at a later time
    this.reset();
    this._player.onfinish = () => this._onFinish();
  }

  private _onFinish() {
    if (!this._finished) {
      this._finished = true;
      if (!isPresent(this.parentPlayer)) {
        this.destroy();
      }
      this._subscriptions.forEach(fn => fn());
      this._subscriptions = [];
    }
  }

  onDone(fn: Function): void { this._subscriptions.push(fn); }

  play(): void { this._player.play(); }

  pause(): void { this._player.pause(); }

  finish(): void {
    this._onFinish();
    this._player.finish();
  }

  reset(): void { this._player.cancel(); }

  restart(): void {
    this.reset();
    this.play();
  }

  destroy(): void {
    this.reset();
    this._onFinish();
  }

  setPosition(p: any /** TODO #9100 */): void { this._player.currentTime = p * this.totalTime; }

  getPosition(): number { return this._player.currentTime / this.totalTime; }
}
