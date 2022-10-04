/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import EventEmitter from './events';

import type {ComponentFilter, Wall} from './types';
import type {
  InspectedElementPayload,
  OwnersList,
  ProfilingDataBackend,
  RendererID,
} from 'react-devtools-shared/src/backend/types';
import type {StyleAndLayout as StyleAndLayoutPayload} from 'react-devtools-shared/src/backend/NativeStyleEditor/types';
import type {BrowserTheme} from 'react-devtools-shared/src/devtools/views/DevTools';

const BATCH_DURATION = 100;

// This message specifies the version of the DevTools protocol currently supported by the backend,
// as well as the earliest NPM version (e.g. "4.13.0") that protocol is supported by on the frontend.
// This enables an older frontend to display an upgrade message to users for a newer, unsupported backend.
export type BridgeProtocol = {
  // Version supported by the current frontend/backend.
  version: number,

  // NPM version range that also supports this version.
  // Note that 'maxNpmVersion' is only set when the version is bumped.
  minNpmVersion: string,
  maxNpmVersion: string | null,
};

// Bump protocol version whenever a backwards breaking change is made
// in the messages sent between BackendBridge and FrontendBridge.
// This mapping is embedded in both frontend and backend builds.
//
// The backend protocol will always be the latest entry in the BRIDGE_PROTOCOL array.
//
// When an older frontend connects to a newer backend,
// the backend can send the minNpmVersion and the frontend can display an NPM upgrade prompt.
//
// When a newer frontend connects with an older protocol version,
// the frontend can use the embedded minNpmVersion/maxNpmVersion values to display a downgrade prompt.
export const BRIDGE_PROTOCOL: Array<BridgeProtocol> = [
  // This version technically never existed,
  // but a backwards breaking change was added in 4.11,
  // so the safest guess to downgrade the frontend would be to version 4.10.
  {
    version: 0,
    minNpmVersion: '"<4.11.0"',
    maxNpmVersion: '"<4.11.0"',
  },
  // Versions 4.11.x – 4.12.x contained the backwards breaking change,
  // but we didn't add the "fix" of checking the protocol version until 4.13,
  // so we don't recommend downgrading to 4.11 or 4.12.
  {
    version: 1,
    minNpmVersion: '4.13.0',
    maxNpmVersion: '4.21.0',
  },
  // Version 2 adds a StrictMode-enabled and supports-StrictMode bits to add-root operation.
  {
    version: 2,
    minNpmVersion: '4.22.0',
    maxNpmVersion: null,
  },
];

export const currentBridgeProtocol: BridgeProtocol =
  BRIDGE_PROTOCOL[BRIDGE_PROTOCOL.length - 1];

type ElementAndRendererID = {id: number, rendererID: RendererID};

type Message = {
  event: string,
  payload: any,
};

type HighlightElementInDOM = {
  ...ElementAndRendererID,
  displayName: string | null,
  hideAfterTimeout: boolean,
  openNativeElementsPanel: boolean,
  scrollIntoView: boolean,
};

type OverrideValue = {
  ...ElementAndRendererID,
  path: Array<string | number>,
  wasForwarded?: boolean,
  value: any,
};

type OverrideHookState = {
  ...OverrideValue,
  hookID: number,
};

type PathType = 'props' | 'hooks' | 'state' | 'context';

type DeletePath = {
  ...ElementAndRendererID,
  type: PathType,
  hookID?: ?number,
  path: Array<string | number>,
};

type RenamePath = {
  ...ElementAndRendererID,
  type: PathType,
  hookID?: ?number,
  oldPath: Array<string | number>,
  newPath: Array<string | number>,
};

type OverrideValueAtPath = {
  ...ElementAndRendererID,
  type: PathType,
  hookID?: ?number,
  path: Array<string | number>,
  value: any,
};

type OverrideError = {
  ...ElementAndRendererID,
  forceError: boolean,
};

type OverrideSuspense = {
  ...ElementAndRendererID,
  forceFallback: boolean,
};

type CopyElementPathParams = {
  ...ElementAndRendererID,
  path: Array<string | number>,
};

type ViewAttributeSourceParams = {
  ...ElementAndRendererID,
  path: Array<string | number>,
};

type InspectElementParams = {
  ...ElementAndRendererID,
  forceFullData: boolean,
  path: Array<number | string> | null,
  requestID: number,
};

type StoreAsGlobalParams = {
  ...ElementAndRendererID,
  count: number,
  path: Array<string | number>,
};

type NativeStyleEditor_RenameAttributeParams = {
  ...ElementAndRendererID,
  oldName: string,
  newName: string,
  value: string,
};

type NativeStyleEditor_SetValueParams = {
  ...ElementAndRendererID,
  name: string,
  value: string,
};

type UpdateConsolePatchSettingsParams = {
  appendComponentStack: boolean,
  breakOnConsoleErrors: boolean,
  showInlineWarningsAndErrors: boolean,
  hideConsoleLogsInStrictMode: boolean,
  browserTheme: BrowserTheme,
};

type SavedPreferencesParams = {
  appendComponentStack: boolean,
  breakOnConsoleErrors: boolean,
  componentFilters: Array<ComponentFilter>,
  showInlineWarningsAndErrors: boolean,
  hideConsoleLogsInStrictMode: boolean,
};

export type BackendEvents = {
  backendVersion: [string],
  bridgeProtocol: [BridgeProtocol],
  extensionBackendInitialized: [],
  fastRefreshScheduled: [],
  getSavedPreferences: [],
  inspectedElement: [InspectedElementPayload],
  isBackendStorageAPISupported: [boolean],
  isSynchronousXHRSupported: [boolean],
  operations: [Array<number>],
  ownersList: [OwnersList],
  overrideComponentFilters: [Array<ComponentFilter>],
  profilingData: [ProfilingDataBackend],
  profilingStatus: [boolean],
  reloadAppForProfiling: [],
  selectFiber: [number],
  shutdown: [],
  stopInspectingNative: [boolean],
  syncSelectionFromNativeElementsPanel: [],
  syncSelectionToNativeElementsPanel: [],
  unsupportedRendererVersion: [RendererID],

  // React Native style editor plug-in.
  isNativeStyleEditorSupported: [
    {isSupported: boolean, validAttributes: ?$ReadOnlyArray<string>},
  ],
  NativeStyleEditor_styleAndLayout: [StyleAndLayoutPayload],
};

type FrontendEvents = {
  clearErrorsAndWarnings: [{rendererID: RendererID}],
  clearErrorsForFiberID: [ElementAndRendererID],
  clearNativeElementHighlight: [],
  clearWarningsForFiberID: [ElementAndRendererID],
  copyElementPath: [CopyElementPathParams],
  deletePath: [DeletePath],
  getBackendVersion: [],
  getBridgeProtocol: [],
  getOwnersList: [ElementAndRendererID],
  getProfilingData: [{rendererID: RendererID}],
  getProfilingStatus: [],
  highlightNativeElement: [HighlightElementInDOM],
  inspectElement: [InspectElementParams],
  logElementToConsole: [ElementAndRendererID],
  overrideError: [OverrideError],
  overrideSuspense: [OverrideSuspense],
  overrideValueAtPath: [OverrideValueAtPath],
  profilingData: [ProfilingDataBackend],
  reloadAndProfile: [boolean],
  renamePath: [RenamePath],
  savedPreferences: [SavedPreferencesParams],
  selectFiber: [number],
  setTraceUpdatesEnabled: [boolean],
  shutdown: [],
  startInspectingNative: [],
  startProfiling: [boolean],
  stopInspectingNative: [boolean],
  stopProfiling: [],
  storeAsGlobal: [StoreAsGlobalParams],
  updateComponentFilters: [Array<ComponentFilter>],
  updateConsolePatchSettings: [UpdateConsolePatchSettingsParams],
  viewAttributeSource: [ViewAttributeSourceParams],
  viewElementSource: [ElementAndRendererID],

  // React Native style editor plug-in.
  NativeStyleEditor_measure: [ElementAndRendererID],
  NativeStyleEditor_renameAttribute: [NativeStyleEditor_RenameAttributeParams],
  NativeStyleEditor_setValue: [NativeStyleEditor_SetValueParams],

  // Temporarily support newer standalone front-ends sending commands to older embedded backends.
  // We do this because React Native embeds the React DevTools backend,
  // but cannot control which version of the frontend users use.
  //
  // Note that nothing in the newer backend actually listens to these events,
  // but the new frontend still dispatches them (in case older backends are listening to them instead).
  //
  // Note that this approach does no support the combination of a newer backend with an older frontend.
  // It would be more work to support both approaches (and not run handlers twice)
  // so I chose to support the more likely/common scenario (and the one more difficult for an end user to "fix").
  overrideContext: [OverrideValue],
  overrideHookState: [OverrideHookState],
  overrideProps: [OverrideValue],
  overrideState: [OverrideValue],
};

class Bridge<
  OutgoingEvents: Object,
  IncomingEvents: Object,
> extends EventEmitter<{
  ...IncomingEvents,
  ...OutgoingEvents,
}> {
  _isShutdown: boolean = false;
  _messageQueue: Array<any> = [];
  _timeoutID: TimeoutID | null = null;
  _wall: Wall;
  _wallUnlisten: Function | null = null;

  constructor(wall: Wall) {
    super();

    this._wall = wall;

    this._wallUnlisten =
      wall.listen((message: Message) => {
        if (message && message.event) {
          (this: any).emit(message.event, message.payload);
        }
      }) || null;

    // Temporarily support older standalone front-ends sending commands to newer embedded backends.
    // We do this because React Native embeds the React DevTools backend,
    // but cannot control which version of the frontend users use.
    this.addListener('overrideValueAtPath', this.overrideValueAtPath);
  }

  // Listening directly to the wall isn't advised.
  // It can be used to listen for legacy (v3) messages (since they use a different format).
  get wall(): Wall {
    return this._wall;
  }

  send<EventName: $Keys<OutgoingEvents>>(
    event: EventName,
    ...payload: $ElementType<OutgoingEvents, EventName>
  ) {
    if (this._isShutdown) {
      console.warn(
        `Cannot send message "${event}" through a Bridge that has been shutdown.`,
      );
      return;
    }

    // When we receive a message:
    // - we add it to our queue of messages to be sent
    // - if there hasn't been a message recently, we set a timer for 0 ms in
    //   the future, allowing all messages created in the same tick to be sent
    //   together
    // - if there *has* been a message flushed in the last BATCH_DURATION ms
    //   (or we're waiting for our setTimeout-0 to fire), then _timeoutID will
    //   be set, and we'll simply add to the queue and wait for that
    this._messageQueue.push(event, payload);
    if (!this._timeoutID) {
      this._timeoutID = setTimeout(this._flush, 0);
    }
  }

  shutdown() {
    if (this._isShutdown) {
      console.warn('Bridge was already shutdown.');
      return;
    }

    // Queue the shutdown outgoing message for subscribers.
    this.send('shutdown');

    // Mark this bridge as destroyed, i.e. disable its public API.
    this._isShutdown = true;

    // Disable the API inherited from EventEmitter that can add more listeners and send more messages.
    // $FlowFixMe This property is not writable.
    this.addListener = function() {};
    // $FlowFixMe This property is not writable.
    this.emit = function() {};
    // NOTE: There's also EventEmitter API like `on` and `prependListener` that we didn't add to our Flow type of EventEmitter.

    // Unsubscribe this bridge incoming message listeners to be sure, and so they don't have to do that.
    this.removeAllListeners();

    // Stop accepting and emitting incoming messages from the wall.
    const wallUnlisten = this._wallUnlisten;
    if (wallUnlisten) {
      wallUnlisten();
    }

    // Synchronously flush all queued outgoing messages.
    // At this step the subscribers' code may run in this call stack.
    do {
      this._flush();
    } while (this._messageQueue.length);

    // Make sure once again that there is no dangling timer.
    if (this._timeoutID !== null) {
      clearTimeout(this._timeoutID);
      this._timeoutID = null;
    }
  }

  _flush: () => void = () => {
    // This method is used after the bridge is marked as destroyed in shutdown sequence,
    // so we do not bail out if the bridge marked as destroyed.
    // It is a private method that the bridge ensures is only called at the right times.

    if (this._timeoutID !== null) {
      clearTimeout(this._timeoutID);
      this._timeoutID = null;
    }

    if (this._messageQueue.length) {
      for (let i = 0; i < this._messageQueue.length; i += 2) {
        this._wall.send(this._messageQueue[i], ...this._messageQueue[i + 1]);
      }
      this._messageQueue.length = 0;

      // Check again for queued messages in BATCH_DURATION ms. This will keep
      // flushing in a loop as long as messages continue to be added. Once no
      // more are, the timer expires.
      this._timeoutID = setTimeout(this._flush, BATCH_DURATION);
    }
  };

  // Temporarily support older standalone backends by forwarding "overrideValueAtPath" commands
  // to the older message types they may be listening to.
  overrideValueAtPath: OverrideValueAtPath => void = ({
    id,
    path,
    rendererID,
    type,
    value,
  }: OverrideValueAtPath) => {
    switch (type) {
      case 'context':
        this.send('overrideContext', {
          id,
          path,
          rendererID,
          wasForwarded: true,
          value,
        });
        break;
      case 'hooks':
        this.send('overrideHookState', {
          id,
          path,
          rendererID,
          wasForwarded: true,
          value,
        });
        break;
      case 'props':
        this.send('overrideProps', {
          id,
          path,
          rendererID,
          wasForwarded: true,
          value,
        });
        break;
      case 'state':
        this.send('overrideState', {
          id,
          path,
          rendererID,
          wasForwarded: true,
          value,
        });
        break;
    }
  };
}

export type BackendBridge = Bridge<BackendEvents, FrontendEvents>;
export type FrontendBridge = Bridge<FrontendEvents, BackendEvents>;

export default Bridge;
