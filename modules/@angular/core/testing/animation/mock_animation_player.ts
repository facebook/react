import {AnimationPlayer} from '../../src/animation/animation_player';
import {isPresent} from '../../src/facade/lang';

export class MockAnimationPlayer implements AnimationPlayer {
  private _subscriptions: any[] /** TODO #9100 */ = [];
  private _finished = false;
  private _destroyed = false;
  public parentPlayer: AnimationPlayer = null;

  public log: any[] /** TODO #9100 */ = [];

  private _onfinish(): void {
    if (!this._finished) {
      this._finished = true;
      this.log.push('finish');

      this._subscriptions.forEach((entry) => { entry(); });
      this._subscriptions = [];
      if (!isPresent(this.parentPlayer)) {
        this.destroy();
      }
    }
  }

  onDone(fn: Function): void { this._subscriptions.push(fn); }

  play(): void { this.log.push('play'); }

  pause(): void { this.log.push('pause'); }

  restart(): void { this.log.push('restart'); }

  finish(): void { this._onfinish(); }

  reset(): void { this.log.push('reset'); }

  destroy(): void {
    if (!this._destroyed) {
      this._destroyed = true;
      this.finish();
      this.log.push('destroy');
    }
  }

  setPosition(p: any /** TODO #9100 */): void {}
  getPosition(): number { return 0; }
}
