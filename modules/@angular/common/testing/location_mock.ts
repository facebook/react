import {EventEmitter, Injectable} from '@angular/core';

import {Location} from '../index';
import {ObservableWrapper} from '../src/facade/async';
import {LocationStrategy} from '../src/location/location_strategy';


/**
 * A spy for {@link Location} that allows tests to fire simulated location events.
 */
@Injectable()
export class SpyLocation implements Location {
  urlChanges: string[] = [];
  /** @internal */
  private _history: LocationState[] = [new LocationState('', '')];
  /** @internal */
  private _historyIndex: number = 0;
  /** @internal */
  _subject: EventEmitter<any> = new EventEmitter();
  /** @internal */
  _baseHref: string = '';
  /** @internal */
  _platformStrategy: LocationStrategy = null;

  setInitialPath(url: string) { this._history[this._historyIndex].path = url; }

  setBaseHref(url: string) { this._baseHref = url; }

  path(): string { return this._history[this._historyIndex].path; }

  isCurrentPathEqualTo(path: string, query: string = ''): boolean {
    var givenPath = path.endsWith('/') ? path.substring(0, path.length - 1) : path;
    var currPath =
        this.path().endsWith('/') ? this.path().substring(0, this.path().length - 1) : this.path();

    return currPath == givenPath + (query.length > 0 ? ('?' + query) : '');
  }

  simulateUrlPop(pathname: string) {
    ObservableWrapper.callEmit(this._subject, {'url': pathname, 'pop': true});
  }

  simulateHashChange(pathname: string) {
    // Because we don't prevent the native event, the browser will independently update the path
    this.setInitialPath(pathname);
    this.urlChanges.push('hash: ' + pathname);
    ObservableWrapper.callEmit(this._subject, {'url': pathname, 'pop': true, 'type': 'hashchange'});
  }

  prepareExternalUrl(url: string): string {
    if (url.length > 0 && !url.startsWith('/')) {
      url = '/' + url;
    }
    return this._baseHref + url;
  }

  go(path: string, query: string = '') {
    path = this.prepareExternalUrl(path);

    if (this._historyIndex > 0) {
      this._history.splice(this._historyIndex + 1);
    }
    this._history.push(new LocationState(path, query));
    this._historyIndex = this._history.length - 1;

    var locationState = this._history[this._historyIndex - 1];
    if (locationState.path == path && locationState.query == query) {
      return;
    }

    var url = path + (query.length > 0 ? ('?' + query) : '');
    this.urlChanges.push(url);
  }

  replaceState(path: string, query: string = '') {
    path = this.prepareExternalUrl(path);

    var history = this._history[this._historyIndex];
    if (history.path == path && history.query == query) {
      return;
    }

    history.path = path;
    history.query = query;

    var url = path + (query.length > 0 ? ('?' + query) : '');
    this.urlChanges.push('replace: ' + url);
  }

  forward() {
    if (this._historyIndex < (this._history.length - 1)) {
      this._historyIndex++;
      ObservableWrapper.callEmit(this._subject, {'url': this.path(), 'pop': true});
    }
  }

  back() {
    if (this._historyIndex > 0) {
      this._historyIndex--;
      ObservableWrapper.callEmit(this._subject, {'url': this.path(), 'pop': true});
    }
  }

  subscribe(
      onNext: (value: any) => void, onThrow: (error: any) => void = null,
      onReturn: () => void = null): Object {
    return ObservableWrapper.subscribe(this._subject, onNext, onThrow, onReturn);
  }

  normalize(url: string): string { return null; }
}

class LocationState {
  path: string;
  query: string;
  constructor(path: string, query: string) {
    this.path = path;
    this.query = query;
  }
}
