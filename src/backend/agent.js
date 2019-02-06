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

    bridge.addListener('shutdown', () => this.emit('shutdown'));

    bridge.addListener('inspectElement', this.inspectElement);
    bridge.addListener('selectElement', this.selectElement);
    // TODO Listen to bridge for things like selection.
    // bridge.on('...'), this...);
  }

  inspectElement = ({ id, rendererID }: { id: number, rendererID: number }) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    }
    this._bridge.send('inspectedElement', renderer.inspectElement(id));
  };

  selectElement = ({ id, rendererID }: { id: number, rendererID: number }) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    }
    this._bridge.send('selectElement', renderer.selectElement(id));
  };

  setRendererInterface(
    rendererID: RendererID,
    rendererInterface: RendererInterface
  ) {
    this._rendererInterfaces[rendererID] = rendererInterface;
  }

  onHookOperations = (operations: Uint32Array) => {
    debug('onHookOperations', operations);
    this._bridge.send('operations', operations, [operations.buffer]);
  };
}
