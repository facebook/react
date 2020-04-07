/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Wakeable} from 'shared/ReactTypes';

const nativeConsole: Object = console;
let nativeConsoleLog: null | Function = null;

const pendingGroupArgs: Array<any> = [];
let printedGroupIndex: number = -1;

function group(...groupArgs): void {
  pendingGroupArgs.push(groupArgs);

  if (nativeConsoleLog === null) {
    nativeConsoleLog = nativeConsole.log;
    nativeConsole.log = log;
  }
}

function groupEnd(): void {
  pendingGroupArgs.pop();
  while (printedGroupIndex >= pendingGroupArgs.length) {
    nativeConsole.groupEnd();
    printedGroupIndex--;
  }

  if (pendingGroupArgs.length === 0) {
    nativeConsole.log = nativeConsoleLog;
    nativeConsoleLog = null;
  }
}

function log(...logArgs): void {
  if (printedGroupIndex < pendingGroupArgs.length - 1) {
    for (let i = printedGroupIndex + 1; i < pendingGroupArgs.length; i++) {
      const groupArgs = pendingGroupArgs[i];
      nativeConsole.group(...groupArgs);
    }
    printedGroupIndex = pendingGroupArgs.length - 1;
  }
  if (typeof nativeConsoleLog === 'function') {
    nativeConsoleLog(...logArgs);
  } else {
    nativeConsole.log(...logArgs);
  }
}

const REACT_LOGO_STYLE =
  'background-color: #20232a; color: #61dafb; padding: 0 2px;';

export function logCommitStarted(priorityLabel: string): void {
  group(
    `%c⚛️%c commit%c (priority: ${priorityLabel})`,
    REACT_LOGO_STYLE,
    '',
    'font-weight: normal;',
  );
}

export function logCommitStopped(): void {
  groupEnd();
}

export function logComponentSuspended(
  componentName: string,
  wakeable: Wakeable,
): void {
  log(
    `%c⚛️%c ${componentName} suspended`,
    REACT_LOGO_STYLE,
    'color: #80366d; font-weight: bold;',
    wakeable,
  );
}

export function logLayoutEffectsStarted(priorityLabel: string): void {
  group(
    `%c⚛️%c layout effects%c (priority: ${priorityLabel})`,
    REACT_LOGO_STYLE,
    '',
    'font-weight: normal;',
  );
}

export function logLayoutEffectsStopped(): void {
  groupEnd();
}

export function logPassiveEffectsStarted(priorityLabel: string): void {
  group(
    `%c⚛️%c passive effects%c (priority: ${priorityLabel})`,
    REACT_LOGO_STYLE,
    '',
    'font-weight: normal;',
  );
}

export function logPassiveEffectsStopped(): void {
  groupEnd();
}

export function logRenderStarted(priorityLabel: string): void {
  group(
    `%c⚛️%c render%c (priority: ${priorityLabel})`,
    REACT_LOGO_STYLE,
    '',
    'font-weight: normal;',
  );
}

export function logRenderStopped(): void {
  groupEnd();
}

export function logForceUpdateScheduled(
  componentName: string,
  priorityLabel: string,
): void {
  log(
    `%c⚛️%c ${componentName} forced update %c(priority: ${priorityLabel})`,
    REACT_LOGO_STYLE,
    'color: #db2e1f; font-weight: bold;',
    '',
  );
}

export function logRenderScheduled(priorityLabel: string): void {
  log(
    `%c⚛️%c render scheduled%c (priority: ${priorityLabel})`,
    REACT_LOGO_STYLE,
    'color: #0265e3; font-weight: bold;',
    '',
  );
}

export function logStateUpdateScheduled(
  componentName: string,
  priorityLabel: string,
  payloadOrAction: any,
): void {
  log(
    `%c⚛️%c ${componentName} updated state %c(priority: ${priorityLabel})`,
    REACT_LOGO_STYLE,
    'color: #01a252; font-weight: bold;',
    '',
    payloadOrAction,
  );
}
