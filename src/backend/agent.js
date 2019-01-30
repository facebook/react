// @flow

import EventEmitter from 'events';
import { __DEBUG__ } from '../constants';

import type { RendererID, RendererInterface } from './types';
import type { Bridge } from '../types';

const debug = (methodName, ...args) => {
  if (__DEBUG__) {
    console.log(
      `%cAgent %c${methodName}`,
      'color: purple; font-weight: bold;',
      'font-weight: bold;',
      ...args
    );
  }
};

export default class Agent extends EventEmitter {
  _bridge: Bridge = ((null: any): Bridge);
  _rendererInterfaces: { [key: RendererID]: RendererInterface } = {};

  addBridge(bridge: Bridge) {
    this._bridge = bridge;

    bridge.on('shutdown', () => this.emit('shutdown'));

    // TODO Listen to bridge for things like selection.
    // bridge.on('...'), this...);
  }

  setRendererInterface(
    rendererID: RendererID,
    rendererInterface: RendererInterface
  ) {
    this._rendererInterfaces[rendererID] = rendererInterface;
  }

  onHookDisplayNames = (displayNames: Map<number, string>) => {
    debug('onHookDisplayNames', displayNames);
    this._bridge.send('displayNames', displayNames);
  };

  onHookKeys = (keys: Map<number, string>) => {
    debug('onHookKeys', keys);
    this._bridge.send('keys', keys);
  };

  onHookOperations = (operations: Uint32Array) => {
    debug('onHookOperations', operations);
    this._bridge.send('operations', operations, [operations.buffer]);
  };

  onHookRootCommitted = (rootID: string) => {
    debug('onHookRootCommitted', rootID);
    this._bridge.send('rootCommitted', rootID);
  };
}
