// @flow

import EventEmitter from 'events';
import memoize from 'memoize-one';
import throttle from 'lodash.throttle';
import {
  LOCAL_STORAGE_RELOAD_AND_PROFILE_KEY,
  SESSION_STORAGE_LAST_SELECTION_KEY,
  __DEBUG__,
} from '../constants';
import { hideOverlay, showOverlay } from './views/Highlighter';

import type {
  OwnersList,
  PathFrame,
  PathMatch,
  RendererID,
  RendererInterface,
} from './types';
import type { Bridge, ComponentFilter } from '../types';

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

type ElementAndRendererID = {|
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

type OverrideSuspenseParams = {|
  id: number,
  rendererID: number,
  forceFallback: boolean,
|};

type PersistedSelection = {|
  rendererID: number,
  path: Array<PathFrame>,
|};

export default class Agent extends EventEmitter {
  _bridge: Bridge;
  _isProfiling: boolean = false;
  _rendererInterfaces: { [key: RendererID]: RendererInterface } = {};
  _persistedSelection: PersistedSelection | null = null;
  _persistedSelectionMatch: PathMatch | null = null;

  constructor(bridge: Bridge) {
    super();

    if (localStorage.getItem(LOCAL_STORAGE_RELOAD_AND_PROFILE_KEY) === 'true') {
      this._isProfiling = true;

      localStorage.removeItem(LOCAL_STORAGE_RELOAD_AND_PROFILE_KEY);
    }

    if (typeof sessionStorage !== 'undefined') {
      const persistedSelectionString = sessionStorage.getItem(
        SESSION_STORAGE_LAST_SELECTION_KEY
      );
      if (persistedSelectionString != null) {
        this._persistedSelection = JSON.parse(persistedSelectionString);
      }
    }

    this._bridge = bridge;

    bridge.addListener('captureScreenshot', this.captureScreenshot);
    bridge.addListener(
      'clearHighlightedElementInDOM',
      this.clearHighlightedElementInDOM
    );
    bridge.addListener('getProfilingData', this.getProfilingData);
    bridge.addListener('getProfilingStatus', this.getProfilingStatus);
    bridge.addListener('highlightElementInDOM', this.highlightElementInDOM);
    bridge.addListener('getOwnersList', this.getOwnersList);
    bridge.addListener('inspectElement', this.inspectElement);
    bridge.addListener('logElementToConsole', this.logElementToConsole);
    bridge.addListener('overrideContext', this.overrideContext);
    bridge.addListener('overrideHookState', this.overrideHookState);
    bridge.addListener('overrideProps', this.overrideProps);
    bridge.addListener('overrideState', this.overrideState);
    bridge.addListener('overrideSuspense', this.overrideSuspense);
    bridge.addListener('reloadAndProfile', this.reloadAndProfile);
    bridge.addListener('screenshotCaptured', this.screenshotCaptured);
    bridge.addListener('selectElement', this.selectElement);
    bridge.addListener('startInspectingDOM', this.startInspectingDOM);
    bridge.addListener('startProfiling', this.startProfiling);
    bridge.addListener('stopInspectingDOM', this.stopInspectingDOM);
    bridge.addListener('stopProfiling', this.stopProfiling);
    bridge.addListener(
      'syncSelectionFromNativeElementsPanel',
      this.syncSelectionFromNativeElementsPanel
    );
    bridge.addListener('shutdown', this.shutdown);
    bridge.addListener('updateComponentFilters', this.updateComponentFilters);
    bridge.addListener('viewElementSource', this.viewElementSource);

    if (this._isProfiling) {
      bridge.send('profilingStatus', true);
    }
  }

  captureScreenshot = ({
    commitIndex,
    rootID,
  }: {
    commitIndex: number,
    rootID: number,
  }) => {
    this._bridge.send('captureScreenshot', { commitIndex, rootID });
  };

  getIDForNode(node: Object): number | null {
    for (let rendererID in this._rendererInterfaces) {
      // A renderer will throw if it can't find a fiber for the specified node.
      try {
        const renderer = ((this._rendererInterfaces[
          (rendererID: any)
        ]: any): RendererInterface);
        return renderer.getFiberIDForNative(node, true);
      } catch (e) {}
    }
    return null;
  }

  getProfilingData = ({ rendererID }: {| rendererID: RendererID |}) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}"`);
    }

    this._bridge.send('profilingData', renderer.getProfilingData());
  };

  getProfilingStatus = () => {
    this._bridge.send('profilingStatus', this._isProfiling);
  };

  clearHighlightedElementInDOM = () => {
    hideOverlay();
  };

  highlightElementInDOM = ({
    displayName,
    hideAfterTimeout,
    id,
    openNativeElementsPanel,
    rendererID,
    scrollIntoView,
  }: {
    displayName: string,
    hideAfterTimeout: boolean,
    id: number,
    openNativeElementsPanel: boolean,
    rendererID: number,
    scrollIntoView: boolean,
  }) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    }

    let nodes: ?Array<HTMLElement> = null;
    if (renderer !== null) {
      nodes = ((renderer.findNativeNodesForFiberID(
        id
      ): any): ?Array<HTMLElement>);
    }

    if (nodes != null && nodes[0] != null) {
      const node = nodes[0];
      if (scrollIntoView && typeof node.scrollIntoView === 'function') {
        // If the node isn't visible show it before highlighting it.
        // We may want to reconsider this; it might be a little disruptive.
        node.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
      showOverlay(nodes, displayName, hideAfterTimeout);
      if (openNativeElementsPanel) {
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$0 = node;
        this._bridge.send('syncSelectionToNativeElementsPanel');
      }
    } else {
      hideOverlay();
    }
  };

  getOwnersList = ({ id, rendererID }: ElementAndRendererID) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    } else {
      const owners = renderer.getOwnersList(id);
      this._bridge.send('ownersList', ({ id, owners }: OwnersList));
    }
  };

  inspectElement = ({ id, rendererID }: ElementAndRendererID) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    } else {
      this._bridge.send('inspectedElement', renderer.inspectElement(id));
    }
  };

  logElementToConsole = ({ id, rendererID }: ElementAndRendererID) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    } else {
      renderer.logElementToConsole(id);
    }
  };

  reloadAndProfile = () => {
    localStorage.setItem(LOCAL_STORAGE_RELOAD_AND_PROFILE_KEY, 'true');

    // This code path should only be hit if the shell has explicitly told the Store that it supports profiling.
    // In that case, the shell must also listen for this specific message to know when it needs to reload the app.
    // The agent can't do this in a way that is renderer agnostic.
    this._bridge.send('reloadAppForProfiling');
  };

  screenshotCaptured = ({
    commitIndex,
    dataURL,
  }: {|
    commitIndex: number,
    dataURL: string,
  |}) => {
    this._bridge.send('screenshotCaptured', { commitIndex, dataURL });
  };

  selectElement = ({ id, rendererID }: ElementAndRendererID) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    } else {
      renderer.selectElement(id);

      // When user selects an element, stop trying to restore the selection,
      // and instead remember the current selection for the next reload.
      if (
        this._persistedSelectionMatch === null ||
        this._persistedSelectionMatch.id !== id
      ) {
        this._persistedSelection = null;
        this._persistedSelectionMatch = null;
        renderer.setTrackedPath(null);
        this._throttledPersistSelection(rendererID, id);
      }

      // TODO: If there was a way to change the selected DOM element
      // in native Elements tab without forcing a switch to it, we'd do it here.
      // For now, it doesn't seem like there is a way to do that:
      // https://github.com/bvaughn/react-devtools-experimental/issues/102
      // (Setting $0 doesn't work, and calling inspect() switches the tab.)
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

  overrideSuspense = ({
    id,
    rendererID,
    forceFallback,
  }: OverrideSuspenseParams) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    } else {
      renderer.overrideSuspense(id, forceFallback);
    }
  };

  setRendererInterface(
    rendererID: RendererID,
    rendererInterface: RendererInterface
  ) {
    this._rendererInterfaces[rendererID] = rendererInterface;

    if (this._isProfiling) {
      rendererInterface.startProfiling();
    }

    // When the renderer is attached, we need to tell it whether
    // we remember the previous selection that we'd like to restore.
    // It'll start tracking mounts for matches to the last selection path.
    const selection = this._persistedSelection;
    if (selection !== null && selection.rendererID === rendererID) {
      rendererInterface.setTrackedPath(selection.path);
    }
  }

  syncSelectionFromNativeElementsPanel = () => {
    const target = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$0;
    if (target == null) {
      return;
    }
    const id = this.getIDForNode(target);
    if (id !== null) {
      this._bridge.send('selectFiber', id);
    }
  };

  shutdown = () => {
    // Clean up the overlay if visible, and associated events.
    this.stopInspectingDOM();
    this.emit('shutdown');
  };

  startInspectingDOM = () => {
    window.addEventListener('click', this._onClick, true);
    window.addEventListener('mousedown', this._onMouseEvent, true);
    window.addEventListener('mouseover', this._onMouseEvent, true);
    window.addEventListener('mouseup', this._onMouseEvent, true);
    window.addEventListener('pointerdown', this._onPointerDown, true);
    window.addEventListener('pointerover', this._onPointerOver, true);
    window.addEventListener('pointerup', this._onPointerUp, true);
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
    window.removeEventListener('mousedown', this._onMouseEvent, true);
    window.removeEventListener('mouseover', this._onMouseEvent, true);
    window.removeEventListener('mouseup', this._onMouseEvent, true);
    window.removeEventListener('pointerdown', this._onPointerDown, true);
    window.removeEventListener('pointerover', this._onPointerOver, true);
    window.removeEventListener('pointerup', this._onPointerUp, true);
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

  updateComponentFilters = (componentFilters: Array<ComponentFilter>) => {
    for (let rendererID in this._rendererInterfaces) {
      const renderer = ((this._rendererInterfaces[
        (rendererID: any)
      ]: any): RendererInterface);
      renderer.updateComponentFilters(componentFilters);
    }
  };

  viewElementSource = ({ id, rendererID }: ElementAndRendererID) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    } else {
      renderer.prepareViewElementSource(id);
    }
  };

  onHookOperations = (operations: Uint32Array) => {
    if (__DEBUG__) {
      debug('onHookOperations', operations);
    }

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

    if (this._persistedSelection !== null) {
      const rendererID = operations[0];
      if (this._persistedSelection.rendererID === rendererID) {
        // Check if we can select a deeper match for the persisted selection.
        const renderer = this._rendererInterfaces[rendererID];
        const prevMatch = this._persistedSelectionMatch;
        const nextMatch = renderer.getBestMatchForTrackedPath();
        this._persistedSelectionMatch = nextMatch;
        const prevMatchID = prevMatch !== null ? prevMatch.id : null;
        const nextMatchID = nextMatch !== null ? nextMatch.id : null;
        if (prevMatchID !== nextMatchID) {
          if (nextMatchID !== null) {
            // We moved forward, unlocking a deeper node.
            this._bridge.send('selectFiber', nextMatchID);
          }
        }
        if (nextMatch !== null && nextMatch.isFullMatch) {
          // We've just unlocked the innermost selected node.
          // There's no point tracking it further.
          this._persistedSelection = null;
          this._persistedSelectionMatch = null;
          renderer.setTrackedPath(null);
        }
      }
    }
  };

  _onClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    this.stopInspectingDOM();

    this._bridge.send('stopInspectingDOM', true);
  };

  _onMouseEvent = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  _onPointerDown = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    this._selectFiberForNode(((event.target: any): HTMLElement));
  };

  _onPointerOver = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const target = ((event.target: any): HTMLElement);

    // Don't pass the name explicitly.
    // It will be inferred from DOM tag and Fiber owner.
    showOverlay([target], null, false);

    this._selectFiberForNode(target);
  };

  _onPointerUp = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  _selectFiberForNode = throttle(
    memoize((node: HTMLElement) => {
      const id = this.getIDForNode(node);
      if (id !== null) {
        this._bridge.send('selectFiber', id);
      }
    }),
    200,
    // Don't change the selection in the very first 200ms
    // because those are usually unintentional as you lift the cursor.
    { leading: false }
  );

  _throttledPersistSelection = throttle((rendererID: number, id: number) => {
    // This is throttled, so both renderer and selected ID
    // might not be available by the time we read them.
    // This is why we need the defensive checks here.
    const renderer = this._rendererInterfaces[rendererID];
    const path = renderer != null ? renderer.getPathForElement(id) : null;
    if (typeof sessionStorage !== 'undefined') {
      if (path !== null) {
        sessionStorage.setItem(
          SESSION_STORAGE_LAST_SELECTION_KEY,
          JSON.stringify(({ rendererID, path }: PersistedSelection))
        );
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_LAST_SELECTION_KEY);
      }
    }
  }, 1000);
}
