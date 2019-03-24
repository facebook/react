// @flow

import EventEmitter from 'events';
import { __DEBUG__ } from '../constants';
import { hideOverlay, showOverlay } from './views/Highlighter';

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

type InspectSelectParams = {|
  id: number,
  rendererID: number,
|};

type OverrideHookParams = {|
  id: number,
  hookID: number,
  path: Array<string | number>,
  rendererID: number,
  value: any,
|};

type SetInParams = {|
  id: number,
  path: Array<string | number>,
  rendererID: number,
  value: any,
|};

export default class Agent extends EventEmitter {
  _bridge: Bridge = ((null: any): Bridge);
  _isProfiling: boolean = false;
  _rendererInterfaces: { [key: RendererID]: RendererInterface } = {};

  addBridge(bridge: Bridge) {
    this._bridge = bridge;

    bridge.addListener('getCommitDetails', this.getCommitDetails);
    bridge.addListener('getInteractions', this.getInteractions);
    bridge.addListener('getProfilingStatus', this.getProfilingStatus);
    bridge.addListener('getProfilingSummary', this.getProfilingSummary);
    bridge.addListener('highlightElementInDOM', this.highlightElementInDOM);
    bridge.addListener('inspectElement', this.inspectElement);
    bridge.addListener('overrideContext', this.overrideContext);
    bridge.addListener('overrideHookState', this.overrideHookState);
    bridge.addListener('overrideProps', this.overrideProps);
    bridge.addListener('overrideState', this.overrideState);
    bridge.addListener('selectElement', this.selectElement);
    bridge.addListener('startInspectingDOM', this.startInspectingDOM);
    bridge.addListener('startProfiling', this.startProfiling);
    bridge.addListener('stopInspectingDOM', this.stopInspectingDOM);
    bridge.addListener('stopProfiling', this.stopProfiling);
    bridge.addListener('shutdown', this.shutdown);
    bridge.addListener('viewElementSource', this.viewElementSource);
  }

  getIDForNode(node: Object): number | null {
    for (let rendererID in this._rendererInterfaces) {
      // A renderer will throw if it can't find a fiber for the specified node.
      try {
        const renderer = ((this._rendererInterfaces[
          (rendererID: any)
        ]: any): RendererInterface);
        return renderer.getFiberIDFromNative(node, true);
      } catch (e) {}
    }
    return null;
  }

  getCommitDetails = ({
    commitIndex,
    rendererID,
    rootID,
  }: {
    commitIndex: number,
    rendererID: number,
    rootID: number,
  }) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}"`);
    } else {
      this._bridge.send(
        'commitDetails',
        renderer.getCommitDetails(rootID, commitIndex)
      );
    }
  };

  getInteractions = ({
    rendererID,
    rootID,
  }: {
    rendererID: number,
    rootID: number,
  }) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}"`);
    } else {
      this._bridge.send('interactions', renderer.getInteractions(rootID));
    }
  };

  getProfilingStatus = () => {
    this._bridge.send('profilingStatus', this._isProfiling);
  };

  getProfilingSummary = ({
    rendererID,
    rootID,
  }: {
    rendererID: number,
    rootID: number,
  }) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}"`);
    } else {
      this._bridge.send(
        'profilingSummary',
        renderer.getProfilingSummary(rootID)
      );
    }
  };

  highlightElementInDOM = ({
    displayName,
    id,
    rendererID,
  }: {
    displayName: string,
    id: number,
    rendererID: number,
  }) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    }

    let node: HTMLElement | null = null;
    if (
      renderer !== null &&
      typeof renderer.getNativeFromReactElement === 'function'
    ) {
      node = ((renderer.getNativeFromReactElement(id): any): HTMLElement);
    }

    if (node != null) {
      if (typeof node.scrollIntoView === 'function') {
        // If the node isn't visible show it before highlighting it.
        // We may want to reconsider this; it might be a little disruptive.
        node.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }

      showOverlay(((node: any): HTMLElement), displayName);
    } else {
      hideOverlay();
    }
  };

  inspectElement = ({ id, rendererID }: InspectSelectParams) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    } else {
      this._bridge.send('inspectedElement', renderer.inspectElement(id));
    }
  };

  selectElement = ({ id, rendererID }: InspectSelectParams) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    } else {
      this._bridge.send('selectElement', renderer.selectElement(id));
    }
  };

  overrideContext = ({ id, path, rendererID, value }: SetInParams) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    } else {
      renderer.setInContext(id, path, value);
    }
  };

  overrideHookState = ({
    id,
    hookID,
    path,
    rendererID,
    value,
  }: OverrideHookParams) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    } else {
      renderer.setInHook(id, hookID, path, value);
    }
  };

  overrideProps = ({ id, path, rendererID, value }: SetInParams) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    } else {
      renderer.setInProps(id, path, value);
    }
  };

  overrideState = ({ id, path, rendererID, value }: SetInParams) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    } else {
      renderer.setInState(id, path, value);
    }
  };

  setRendererInterface(
    rendererID: RendererID,
    rendererInterface: RendererInterface
  ) {
    this._rendererInterfaces[rendererID] = rendererInterface;
  }

  shutdown = () => {
    this.emit('shutdown');
  };

  startInspectingDOM = () => {
    window.addEventListener('click', this._onClick, true);
    window.addEventListener('mousedown', this._onMouseDown, true);
    window.addEventListener('mouseover', this._onMouseOver, true);
  };

  startProfiling = () => {
    this._isProfiling = true;
    for (let rendererID in this._rendererInterfaces) {
      const renderer = ((this._rendererInterfaces[
        (rendererID: any)
      ]: any): RendererInterface);
      renderer.startProfiling();
    }
    this._bridge.send('profilingStatus', this._isProfiling);
  };

  stopInspectingDOM = () => {
    hideOverlay();

    window.removeEventListener('click', this._onClick, true);
    window.removeEventListener('mousedown', this._onMouseDown, true);
    window.removeEventListener('mouseover', this._onMouseOver, true);
  };

  stopProfiling = () => {
    this._isProfiling = false;
    for (let rendererID in this._rendererInterfaces) {
      const renderer = ((this._rendererInterfaces[
        (rendererID: any)
      ]: any): RendererInterface);
      renderer.stopProfiling();
    }
    this._bridge.send('profilingStatus', this._isProfiling);
  };

  viewElementSource = ({ id, rendererID }: InspectSelectParams) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    } else {
      renderer.prepareViewElementSource(id);
    }
  };

  onHookOperations = (operations: Uint32Array) => {
    debug('onHookOperations', operations);

    // TODO:
    // The chrome.runtime does not currently support transferables; it forces JSON serialization.
    // See bug https://bugs.chromium.org/p/chromium/issues/detail?id=927134
    //
    // Regarding transferables, the postMessage doc states:
    // If the ownership of an object is transferred, it becomes unusable (neutered)
    // in the context it was sent from and becomes available only to the worker it was sent to.
    //
    // Even though Chrome is eventually JSON serializing the array buffer,
    // using the transferable approach also sometimes causes it to throw:
    //   DOMException: Failed to execute 'postMessage' on 'Window': ArrayBuffer at index 0 is already neutered.
    //
    // See bug https://github.com/bvaughn/react-devtools-experimental/issues/25
    //
    // The Store has a fallback in place that parses the message as JSON if the type isn't an array.
    // For now the simplest fix seems to be to not transfer the array.
    // This will negatively impact performance on Firefox so it's unfortunate,
    // but until we're able to fix the Chrome error mentioned above, it seems necessary.
    //
    // this._bridge.send('operations', operations, [operations.buffer]);
    this._bridge.send('operations', operations);
  };

  _onClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    this.stopInspectingDOM();
    this._bridge.send('stopInspectingDOM');
  };

  _onMouseDown = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const target = ((event.target: any): HTMLElement);
    const id = this.getIDForNode(target);

    if (id !== null) {
      this._bridge.send('selectFiber', id);
    }
  };

  _onMouseOver = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const target = ((event.target: any): HTMLElement);

    showOverlay(target, target.tagName.toLowerCase());
  };
}
