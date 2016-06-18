import {DomAnimatePlayer} from '../src/dom/dom_animate_player';
import {isPresent} from '../src/facade/lang';

export class MockDomAnimatePlayer implements DomAnimatePlayer {
  public captures: {[key: string]: any[]} = {};
  private _position: number = 0;
  private _onfinish: Function = () => {};
  public currentTime: number;

  /** @internal */
  _capture(method: string, data: any): void {
    if (!isPresent(this.captures[method])) {
      this.captures[method] = [];
    }
    this.captures[method].push(data);
  }

  cancel(): void { this._capture('cancel', null); }
  play(): void { this._capture('play', null); }
  pause(): void { this._capture('pause', null); }
  finish(): void {
    this._capture('finish', null);
    this._onfinish();
  }
  set onfinish(fn: Function) {
    this._capture('onfinish', fn);
    this._onfinish = fn;
  }
  get onfinish(): Function { return this._onfinish; }
  set position(val: number) {
    this._capture('position', val);
    this._position = val;
  }
  get position(): number { return this._position; }
}
