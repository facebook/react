/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import EventEmitter from '../events';
import {SESSION_STORAGE_LAST_SELECTION_KEY, __DEBUG__} from '../constants';
import setupHighlighter from './views/Highlighter';
import {
  initialize as setupTraceUpdates,
  toggleEnabled as setTraceUpdatesEnabled,
} from './views/TraceUpdates';
import {currentBridgeProtocol} from 'react-devtools-shared/src/bridge';

import type {BackendBridge} from 'react-devtools-shared/src/bridge';
import type {
  InstanceAndStyle,
  HostInstance,
  OwnersList,
  PathFrame,
  PathMatch,
  RendererID,
  RendererInterface,
  DevToolsHookSettings,
} from './types';
import type {ComponentFilter} from 'react-devtools-shared/src/frontend/types';
import type {GroupItem} from './views/TraceUpdates/canvas';
import {isReactNativeEnvironment} from './utils';
import {
  sessionStorageGetItem,
  sessionStorageRemoveItem,
  sessionStorageSetItem,
} from '../storage';

const debug = (methodName: string, ...args: Array<string>) => {
  if (__DEBUG__) {
    console.log(
      `%cAgent %c${methodName}`,
      'color: purple; font-weight: bold;',
      'font-weight: bold;',
      ...args,
    );
  }
};

type ElementAndRendererID = {
  id: number,
  rendererID: number,
};

type StoreAsGlobalParams = {
  count: number,
  id: number,
  path: Array<string | number>,
  rendererID: number,
};

type CopyElementParams = {
  id: number,
  path: Array<string | number>,
  rendererID: number,
};

type InspectElementParams = {
  forceFullData: boolean,
  id: number,
  path: Array<string | number> | null,
  rendererID: number,
  requestID: number,
};

type OverrideHookParams = {
  id: number,
  hookID: number,
  path: Array<string | number>,
  rendererID: number,
  wasForwarded?: boolean,
  value: any,
};

type SetInParams = {
  id: number,
  path: Array<string | number>,
  rendererID: number,
  wasForwarded?: boolean,
  value: any,
};

type PathType = 'props' | 'hooks' | 'state' | 'context';

type DeletePathParams = {
  type: PathType,
  hookID?: ?number,
  id: number,
  path: Array<string | number>,
  rendererID: number,
};

type RenamePathParams = {
  type: PathType,
  hookID?: ?number,
  id: number,
  oldPath: Array<string | number>,
  newPath: Array<string | number>,
  rendererID: number,
};

type OverrideValueAtPathParams = {
  type: PathType,
  hookID?: ?number,
  id: number,
  path: Array<string | number>,
  rendererID: number,
  value: any,
};

type OverrideErrorParams = {
  id: number,
  rendererID: number,
  forceError: boolean,
};

type OverrideSuspenseParams = {
  id: number,
  rendererID: number,
  forceFallback: boolean,
};

type PersistedSelection = {
  rendererID: number,
  path: Array<PathFrame>,
};

export default class Agent extends EventEmitter<{
  hideNativeHighlight: [],
  showNativeHighlight: [HostInstance],
  startInspectingNative: [],
  stopInspectingNative: [],
  shutdown: [],
  traceUpdates: [Set<HostInstance>],
  drawTraceUpdates: [Array<HostInstance>],
  drawGroupedTraceUpdatesWithNames: [Array<Array<GroupItem>>],
  disableTraceUpdates: [],
  getIfHasUnsupportedRendererVersion: [],
  updateHookSettings: [$ReadOnly<DevToolsHookSettings>],
  getHookSettings: [],
}> {
  _bridge: BackendBridge;
  _isProfiling: boolean = false;
  _rendererInterfaces: {[key: RendererID]: RendererInterface, ...} = {};
  _persistedSelection: PersistedSelection | null = null;
  _persistedSelectionMatch: PathMatch | null = null;
  _traceUpdatesEnabled: boolean = false;
  _onReloadAndProfile:
    | ((recordChangeDescriptions: boolean, recordTimeline: boolean) => void)
    | void;

  constructor(
    bridge: BackendBridge,
    isProfiling: boolean = false,
    onReloadAndProfile?: (
      recordChangeDescriptions: boolean,
      recordTimeline: boolean,
    ) => void,
  ) {
    super();

    this._isProfiling = isProfiling;
    this._onReloadAndProfile = onReloadAndProfile;

    const persistedSelectionString = sessionStorageGetItem(
      SESSION_STORAGE_LAST_SELECTION_KEY,
    );
    if (persistedSelectionString != null) {
      this._persistedSelection = JSON.parse(persistedSelectionString);
    }

    this._bridge = bridge;

    bridge.addListener('clearErrorsAndWarnings', this.clearErrorsAndWarnings);
    bridge.addListener('clearErrorsForElementID', this.clearErrorsForElementID);
    bridge.addListener(
      'clearWarningsForElementID',
      this.clearWarningsForElementID,
    );
    bridge.addListener('copyElementPath', this.copyElementPath);
    bridge.addListener('deletePath', this.deletePath);
    bridge.addListener('getBackendVersion', this.getBackendVersion);
    bridge.addListener('getBridgeProtocol', this.getBridgeProtocol);
    bridge.addListener('getProfilingData', this.getProfilingData);
    bridge.addListener('getProfilingStatus', this.getProfilingStatus);
    bridge.addListener('getOwnersList', this.getOwnersList);
    bridge.addListener('inspectElement', this.inspectElement);
    bridge.addListener('logElementToConsole', this.logElementToConsole);
    bridge.addListener('overrideError', this.overrideError);
    bridge.addListener('overrideSuspense', this.overrideSuspense);
    bridge.addListener('overrideValueAtPath', this.overrideValueAtPath);
    bridge.addListener('reloadAndProfile', this.reloadAndProfile);
    bridge.addListener('renamePath', this.renamePath);
    bridge.addListener('setTraceUpdatesEnabled', this.setTraceUpdatesEnabled);
    bridge.addListener('startProfiling', this.startProfiling);
    bridge.addListener('stopProfiling', this.stopProfiling);
    bridge.addListener('storeAsGlobal', this.storeAsGlobal);
    bridge.addListener(
      'syncSelectionFromBuiltinElementsPanel',
      this.syncSelectionFromBuiltinElementsPanel,
    );
    bridge.addListener('shutdown', this.shutdown);

    bridge.addListener('updateHookSettings', this.updateHookSettings);
    bridge.addListener('getHookSettings', this.getHookSettings);

    bridge.addListener('updateComponentFilters', this.updateComponentFilters);
    bridge.addListener('getEnvironmentNames', this.getEnvironmentNames);
    bridge.addListener(
      'getIfHasUnsupportedRendererVersion',
      this.getIfHasUnsupportedRendererVersion,
    );

    // Temporarily support older standalone front-ends sending commands to newer embedded backends.
    // We do this because React Native embeds the React DevTools backend,
    // but cannot control which version of the frontend users use.
    bridge.addListener('overrideContext', this.overrideContext);
    bridge.addListener('overrideHookState', this.overrideHookState);
    bridge.addListener('overrideProps', this.overrideProps);
    bridge.addListener('overrideState', this.overrideState);

    setupHighlighter(bridge, this);
    setupTraceUpdates(this);

    // By this time, Store should already be initialized and intercept events
    bridge.send('backendInitialized');

    if (this._isProfiling) {
      bridge.send('profilingStatus', true);
    }
  }

  get rendererInterfaces(): {[key: RendererID]: RendererInterface, ...} {
    return this._rendererInterfaces;
  }

  clearErrorsAndWarnings: ({rendererID: RendererID}) => void = ({
    rendererID,
  }) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}"`);
    } else {
      renderer.clearErrorsAndWarnings();
    }
  };

  clearErrorsForElementID: ElementAndRendererID => void = ({
    id,
    rendererID,
  }) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}"`);
    } else {
      renderer.clearErrorsForElementID(id);
    }
  };

  clearWarningsForElementID: ElementAndRendererID => void = ({
    id,
    rendererID,
  }) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}"`);
    } else {
      renderer.clearWarningsForElementID(id);
    }
  };

  copyElementPath: CopyElementParams => void = ({
    id,
    path,
    rendererID,
  }: CopyElementParams) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    } else {
      const value = renderer.getSerializedElementValueByPath(id, path);

      if (value != null) {
        this._bridge.send('saveToClipboard', value);
      } else {
        console.warn(`Unable to obtain serialized value for element "${id}"`);
      }
    }
  };

  deletePath: DeletePathParams => void = ({
    hookID,
    id,
    path,
    rendererID,
    type,
  }: DeletePathParams) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    } else {
      renderer.deletePath(type, id, hookID, path);
    }
  };

  getInstanceAndStyle({
    id,
    rendererID,
  }: ElementAndRendererID): InstanceAndStyle | null {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}"`);
      return null;
    }
    return renderer.getInstanceAndStyle(id);
  }

  getIDForHostInstance(target: HostInstance): number | null {
    if (isReactNativeEnvironment() || typeof target.nodeType !== 'number') {
      // In React Native or non-DOM we simply pick any renderer that has a match.
      for (const rendererID in this._rendererInterfaces) {
        const renderer = ((this._rendererInterfaces[
          (rendererID: any)
        ]: any): RendererInterface);
        try {
          const match = renderer.getElementIDForHostInstance(target);
          if (match != null) {
            return match;
          }
        } catch (error) {
          // Some old React versions might throw if they can't find a match.
          // If so we should ignore it...
        }
      }
      return null;
    } else {
      // In the DOM we use a smarter mechanism to find the deepest a DOM node
      // that is registered if there isn't an exact match.
      let bestMatch: null | Element = null;
      let bestRenderer: null | RendererInterface = null;
      // Find the nearest ancestor which is mounted by a React.
      for (const rendererID in this._rendererInterfaces) {
        const renderer = ((this._rendererInterfaces[
          (rendererID: any)
        ]: any): RendererInterface);
        const nearestNode: null | Element = renderer.getNearestMountedDOMNode(
          (target: any),
        );
        if (nearestNode !== null) {
          if (nearestNode === target) {
            // Exact match we can exit early.
            bestMatch = nearestNode;
            bestRenderer = renderer;
            break;
          }
          if (bestMatch === null || bestMatch.contains(nearestNode)) {
            // If this is the first match or the previous match contains the new match,
            // so the new match is a deeper and therefore better match.
            bestMatch = nearestNode;
            bestRenderer = renderer;
          }
        }
      }
      if (bestRenderer != null && bestMatch != null) {
        try {
          return bestRenderer.getElementIDForHostInstance(bestMatch);
        } catch (error) {
          // Some old React versions might throw if they can't find a match.
          // If so we should ignore it...
        }
      }
      return null;
    }
  }

  getComponentNameForHostInstance(target: HostInstance): string | null {
    // We duplicate this code from getIDForHostInstance to avoid an object allocation.
    if (isReactNativeEnvironment() || typeof target.nodeType !== 'number') {
      // In React Native or non-DOM we simply pick any renderer that has a match.
      for (const rendererID in this._rendererInterfaces) {
        const renderer = ((this._rendererInterfaces[
          (rendererID: any)
        ]: any): RendererInterface);
        try {
          const id = renderer.getElementIDForHostInstance(target);
          if (id) {
            return renderer.getDisplayNameForElementID(id);
          }
        } catch (error) {
          // Some old React versions might throw if they can't find a match.
          // If so we should ignore it...
        }
      }
      return null;
    } else {
      // In the DOM we use a smarter mechanism to find the deepest a DOM node
      // that is registered if there isn't an exact match.
      let bestMatch: null | Element = null;
      let bestRenderer: null | RendererInterface = null;
      // Find the nearest ancestor which is mounted by a React.
      for (const rendererID in this._rendererInterfaces) {
        const renderer = ((this._rendererInterfaces[
          (rendererID: any)
        ]: any): RendererInterface);
        const nearestNode: null | Element = renderer.getNearestMountedDOMNode(
          (target: any),
        );
        if (nearestNode !== null) {
          if (nearestNode === target) {
            // Exact match we can exit early.
            bestMatch = nearestNode;
            bestRenderer = renderer;
            break;
          }
          if (bestMatch === null || bestMatch.contains(nearestNode)) {
            // If this is the first match or the previous match contains the new match,
            // so the new match is a deeper and therefore better match.
            bestMatch = nearestNode;
            bestRenderer = renderer;
          }
        }
      }
      if (bestRenderer != null && bestMatch != null) {
        try {
          const id = bestRenderer.getElementIDForHostInstance(bestMatch);
          if (id) {
            return bestRenderer.getDisplayNameForElementID(id);
          }
        } catch (error) {
          // Some old React versions might throw if they can't find a match.
          // If so we should ignore it...
        }
      }
      return null;
    }
  }

  getBackendVersion: () => void = () => {
    const version = process.env.DEVTOOLS_VERSION;
    if (version) {
      this._bridge.send('backendVersion', version);
    }
  };

  getBridgeProtocol: () => void = () => {
    this._bridge.send('bridgeProtocol', currentBridgeProtocol);
  };

  getProfilingData: ({rendererID: RendererID}) => void = ({rendererID}) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}"`);
    }

    this._bridge.send('profilingData', renderer.getProfilingData());
  };

  getProfilingStatus: () => void = () => {
    this._bridge.send('profilingStatus', this._isProfiling);
  };

  getOwnersList: ElementAndRendererID => void = ({id, rendererID}) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    } else {
      const owners = renderer.getOwnersList(id);
      this._bridge.send('ownersList', ({id, owners}: OwnersList));
    }
  };

  inspectElement: InspectElementParams => void = ({
    forceFullData,
    id,
    path,
    rendererID,
    requestID,
  }) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    } else {
      this._bridge.send(
        'inspectedElement',
        renderer.inspectElement(requestID, id, path, forceFullData),
      );

      // When user selects an element, stop trying to restore the selection,
      // and instead remember the current selection for the next reload.
      if (
        this._persistedSelectionMatch === null ||
        this._persistedSelectionMatch.id !== id
      ) {
        this._persistedSelection = null;
        this._persistedSelectionMatch = null;
        renderer.setTrackedPath(null);
        // Throttle persisting the selection.
        this._lastSelectedElementID = id;
        this._lastSelectedRendererID = rendererID;
        if (!this._persistSelectionTimerScheduled) {
          this._persistSelectionTimerScheduled = true;
          setTimeout(this._persistSelection, 1000);
        }
      }

      // TODO: If there was a way to change the selected DOM element
      // in built-in Elements tab without forcing a switch to it, we'd do it here.
      // For now, it doesn't seem like there is a way to do that:
      // https://github.com/bvaughn/react-devtools-experimental/issues/102
      // (Setting $0 doesn't work, and calling inspect() switches the tab.)
    }
  };

  logElementToConsole: ElementAndRendererID => void = ({id, rendererID}) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    } else {
      renderer.logElementToConsole(id);
    }
  };

  overrideError: OverrideErrorParams => void = ({
    id,
    rendererID,
    forceError,
  }) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    } else {
      renderer.overrideError(id, forceError);
    }
  };

  overrideSuspense: OverrideSuspenseParams => void = ({
    id,
    rendererID,
    forceFallback,
  }) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    } else {
      renderer.overrideSuspense(id, forceFallback);
    }
  };

  overrideValueAtPath: OverrideValueAtPathParams => void = ({
    hookID,
    id,
    path,
    rendererID,
    type,
    value,
  }) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    } else {
      renderer.overrideValueAtPath(type, id, hookID, path, value);
    }
  };

  // Temporarily support older standalone front-ends by forwarding the older message types
  // to the new "overrideValueAtPath" command the backend is now listening to.
  overrideContext: SetInParams => void = ({
    id,
    path,
    rendererID,
    wasForwarded,
    value,
  }) => {
    // Don't forward a message that's already been forwarded by the front-end Bridge.
    // We only need to process the override command once!
    if (!wasForwarded) {
      this.overrideValueAtPath({
        id,
        path,
        rendererID,
        type: 'context',
        value,
      });
    }
  };

  // Temporarily support older standalone front-ends by forwarding the older message types
  // to the new "overrideValueAtPath" command the backend is now listening to.
  overrideHookState: OverrideHookParams => void = ({
    id,
    hookID,
    path,
    rendererID,
    wasForwarded,
    value,
  }) => {
    // Don't forward a message that's already been forwarded by the front-end Bridge.
    // We only need to process the override command once!
    if (!wasForwarded) {
      this.overrideValueAtPath({
        id,
        path,
        rendererID,
        type: 'hooks',
        value,
      });
    }
  };

  // Temporarily support older standalone front-ends by forwarding the older message types
  // to the new "overrideValueAtPath" command the backend is now listening to.
  overrideProps: SetInParams => void = ({
    id,
    path,
    rendererID,
    wasForwarded,
    value,
  }) => {
    // Don't forward a message that's already been forwarded by the front-end Bridge.
    // We only need to process the override command once!
    if (!wasForwarded) {
      this.overrideValueAtPath({
        id,
        path,
        rendererID,
        type: 'props',
        value,
      });
    }
  };

  // Temporarily support older standalone front-ends by forwarding the older message types
  // to the new "overrideValueAtPath" command the backend is now listening to.
  overrideState: SetInParams => void = ({
    id,
    path,
    rendererID,
    wasForwarded,
    value,
  }) => {
    // Don't forward a message that's already been forwarded by the front-end Bridge.
    // We only need to process the override command once!
    if (!wasForwarded) {
      this.overrideValueAtPath({
        id,
        path,
        rendererID,
        type: 'state',
        value,
      });
    }
  };

  onReloadAndProfileSupportedByHost: () => void = () => {
    this._bridge.send('isReloadAndProfileSupportedByBackend', true);
  };

  reloadAndProfile: ({
    recordChangeDescriptions: boolean,
    recordTimeline: boolean,
  }) => void = ({recordChangeDescriptions, recordTimeline}) => {
    if (typeof this._onReloadAndProfile === 'function') {
      this._onReloadAndProfile(recordChangeDescriptions, recordTimeline);
    }

    // This code path should only be hit if the shell has explicitly told the Store that it supports profiling.
    // In that case, the shell must also listen for this specific message to know when it needs to reload the app.
    // The agent can't do this in a way that is renderer agnostic.
    this._bridge.send('reloadAppForProfiling');
  };

  renamePath: RenamePathParams => void = ({
    hookID,
    id,
    newPath,
    oldPath,
    rendererID,
    type,
  }) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    } else {
      renderer.renamePath(type, id, hookID, oldPath, newPath);
    }
  };

  selectNode(target: HostInstance): void {
    const id = this.getIDForHostInstance(target);
    if (id !== null) {
      this._bridge.send('selectElement', id);
    }
  }

  registerRendererInterface(
    rendererID: RendererID,
    rendererInterface: RendererInterface,
  ) {
    this._rendererInterfaces[rendererID] = rendererInterface;

    rendererInterface.setTraceUpdatesEnabled(this._traceUpdatesEnabled);

    // When the renderer is attached, we need to tell it whether
    // we remember the previous selection that we'd like to restore.
    // It'll start tracking mounts for matches to the last selection path.
    const selection = this._persistedSelection;
    if (selection !== null && selection.rendererID === rendererID) {
      rendererInterface.setTrackedPath(selection.path);
    }
  }

  setTraceUpdatesEnabled: (traceUpdatesEnabled: boolean) => void =
    traceUpdatesEnabled => {
      this._traceUpdatesEnabled = traceUpdatesEnabled;

      setTraceUpdatesEnabled(traceUpdatesEnabled);

      for (const rendererID in this._rendererInterfaces) {
        const renderer = ((this._rendererInterfaces[
          (rendererID: any)
        ]: any): RendererInterface);
        renderer.setTraceUpdatesEnabled(traceUpdatesEnabled);
      }
    };

  syncSelectionFromBuiltinElementsPanel: () => void = () => {
    const target = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$0;
    if (target == null) {
      return;
    }
    this.selectNode(target);
  };

  shutdown: () => void = () => {
    // Clean up the overlay if visible, and associated events.
    this.emit('shutdown');

    this._bridge.removeAllListeners();
    this.removeAllListeners();
  };

  startProfiling: ({
    recordChangeDescriptions: boolean,
    recordTimeline: boolean,
  }) => void = ({recordChangeDescriptions, recordTimeline}) => {
    this._isProfiling = true;
    for (const rendererID in this._rendererInterfaces) {
      const renderer = ((this._rendererInterfaces[
        (rendererID: any)
      ]: any): RendererInterface);
      renderer.startProfiling(recordChangeDescriptions, recordTimeline);
    }
    this._bridge.send('profilingStatus', this._isProfiling);
  };

  stopProfiling: () => void = () => {
    this._isProfiling = false;
    for (const rendererID in this._rendererInterfaces) {
      const renderer = ((this._rendererInterfaces[
        (rendererID: any)
      ]: any): RendererInterface);
      renderer.stopProfiling();
    }
    this._bridge.send('profilingStatus', this._isProfiling);
  };

  stopInspectingNative: (selected: boolean) => void = selected => {
    this._bridge.send('stopInspectingHost', selected);
  };

  storeAsGlobal: StoreAsGlobalParams => void = ({
    count,
    id,
    path,
    rendererID,
  }) => {
    const renderer = this._rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    } else {
      renderer.storeAsGlobal(id, path, count);
    }
  };

  updateHookSettings: (settings: $ReadOnly<DevToolsHookSettings>) => void =
    settings => {
      // Propagate the settings, so Backend can subscribe to it and modify hook
      this.emit('updateHookSettings', settings);
    };

  getHookSettings: () => void = () => {
    this.emit('getHookSettings');
  };

  onHookSettings: (settings: $ReadOnly<DevToolsHookSettings>) => void =
    settings => {
      this._bridge.send('hookSettings', settings);
    };

  updateComponentFilters: (componentFilters: Array<ComponentFilter>) => void =
    componentFilters => {
      for (const rendererIDString in this._rendererInterfaces) {
        const rendererID = +rendererIDString;
        const renderer = ((this._rendererInterfaces[
          (rendererID: any)
        ]: any): RendererInterface);
        if (this._lastSelectedRendererID === rendererID) {
          // Changing component filters will unmount and remount the DevTools tree.
          // Track the last selection's path so we can restore the selection.
          const path = renderer.getPathForElement(this._lastSelectedElementID);
          if (path !== null) {
            renderer.setTrackedPath(path);
            this._persistedSelection = {
              rendererID,
              path,
            };
          }
        }
        renderer.updateComponentFilters(componentFilters);
      }
    };

  getEnvironmentNames: () => void = () => {
    let accumulatedNames = null;
    for (const rendererID in this._rendererInterfaces) {
      const renderer = this._rendererInterfaces[+rendererID];
      const names = renderer.getEnvironmentNames();
      if (accumulatedNames === null) {
        accumulatedNames = names;
      } else {
        for (let i = 0; i < names.length; i++) {
          if (accumulatedNames.indexOf(names[i]) === -1) {
            accumulatedNames.push(names[i]);
          }
        }
      }
    }
    this._bridge.send('environmentNames', accumulatedNames || []);
  };

  onTraceUpdates: (nodes: Set<HostInstance>) => void = nodes => {
    this.emit('traceUpdates', nodes);
  };

  onFastRefreshScheduled: () => void = () => {
    if (__DEBUG__) {
      debug('onFastRefreshScheduled');
    }

    this._bridge.send('fastRefreshScheduled');
  };

  onHookOperations: (operations: Array<number>) => void = operations => {
    if (__DEBUG__) {
      debug(
        'onHookOperations',
        `(${operations.length}) [${operations.join(', ')}]`,
      );
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
        if (renderer == null) {
          console.warn(`Invalid renderer id "${rendererID}"`);
        } else {
          const prevMatch = this._persistedSelectionMatch;
          const nextMatch = renderer.getBestMatchForTrackedPath();
          this._persistedSelectionMatch = nextMatch;
          const prevMatchID = prevMatch !== null ? prevMatch.id : null;
          const nextMatchID = nextMatch !== null ? nextMatch.id : null;
          if (prevMatchID !== nextMatchID) {
            if (nextMatchID !== null) {
              // We moved forward, unlocking a deeper node.
              this._bridge.send('selectElement', nextMatchID);
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
    }
  };

  getIfHasUnsupportedRendererVersion: () => void = () => {
    this.emit('getIfHasUnsupportedRendererVersion');
  };

  onUnsupportedRenderer() {
    this._bridge.send('unsupportedRendererVersion');
  }

  _persistSelectionTimerScheduled: boolean = false;
  _lastSelectedRendererID: number = -1;
  _lastSelectedElementID: number = -1;
  _persistSelection: any = () => {
    this._persistSelectionTimerScheduled = false;
    const rendererID = this._lastSelectedRendererID;
    const id = this._lastSelectedElementID;
    // This is throttled, so both renderer and selected ID
    // might not be available by the time we read them.
    // This is why we need the defensive checks here.
    const renderer = this._rendererInterfaces[rendererID];
    const path = renderer != null ? renderer.getPathForElement(id) : null;
    if (path !== null) {
      sessionStorageSetItem(
        SESSION_STORAGE_LAST_SELECTION_KEY,
        JSON.stringify(({rendererID, path}: PersistedSelection)),
      );
    } else {
      sessionStorageRemoveItem(SESSION_STORAGE_LAST_SELECTION_KEY);
    }
  };
}
