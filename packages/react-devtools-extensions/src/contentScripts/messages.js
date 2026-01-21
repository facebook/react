/** @flow */

import type {DevToolsHookSettings} from 'react-devtools-shared/src/backend/types';

export function postMessage(event: UnknownMessageEventData): void {
  window.postMessage(event);
}

export interface UnknownMessageEvent
  extends MessageEvent<UnknownMessageEventData> {}

export type UnknownMessageEventData =
  | HookSettingsInjectorEventData
  | HookInstallerEventData;

export type HookInstallerEventData = {
  source: 'react-devtools-hook-installer',
  payload: HookInstallerEventPayload,
};

export type HookInstallerEventPayload = HookInstallerEventPayloadHandshake;

export type HookInstallerEventPayloadHandshake = {
  handshake: true,
};

export type HookSettingsInjectorEventData = {
  source: 'react-devtools-hook-settings-injector',
  payload: HookSettingsInjectorEventPayload,
};

export type HookSettingsInjectorEventPayload =
  | HookSettingsInjectorEventPayloadHandshake
  | HookSettingsInjectorEventPayloadSettings;

export type HookSettingsInjectorEventPayloadHandshake = {
  handshake: true,
};

export type HookSettingsInjectorEventPayloadSettings = {
  settings: DevToolsHookSettings,
};
