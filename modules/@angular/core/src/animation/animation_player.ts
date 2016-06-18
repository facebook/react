import {BaseException} from '../facade/exceptions';
import {scheduleMicroTask} from '../facade/lang';

export abstract class AnimationPlayer {
  abstract onDone(fn: Function): void;
  abstract play(): void;
  abstract pause(): void;
  abstract restart(): void;
  abstract finish(): void;
  abstract destroy(): void;
  abstract reset(): void;
  abstract setPosition(p: any /** TODO #9100 */): void;
  abstract getPosition(): number;
  get parentPlayer(): AnimationPlayer { throw new BaseException('NOT IMPLEMENTED: Base Class'); }
  set parentPlayer(player: AnimationPlayer) {
    throw new BaseException('NOT IMPLEMENTED: Base Class');
  }
}

export class NoOpAnimationPlayer implements AnimationPlayer {
  private _subscriptions: any[] /** TODO #9100 */ = [];
  public parentPlayer: AnimationPlayer = null;
  constructor() { scheduleMicroTask(() => this._onFinish()); }
  /** @internal */
  _onFinish() {
    this._subscriptions.forEach(entry => { entry(); });
    this._subscriptions = [];
  }
  onDone(fn: Function): void { this._subscriptions.push(fn); }
  play(): void {}
  pause(): void {}
  restart(): void {}
  finish(): void { this._onFinish(); }
  destroy(): void {}
  reset(): void {}
  setPosition(p: any /** TODO #9100 */): void {}
  getPosition(): number { return 0; }
}
