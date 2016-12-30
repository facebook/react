/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactHostOperationHistoryHook
 * @flow
 */

'use strict';

import type { DebugID } from 'ReactInstanceType';

export type Operation = {instanceID: DebugID} & (
  {type: 'mount', payload: string} |
  {type: 'insert child', payload: {toIndex: number, content: string}} |
  {type: 'move child', payload: {fromIndex: number, toIndex: number}} |
  {type: 'replace children', payload: string} |
  {type: 'replace text', payload: string} |
  {type: 'replace with', payload: string} |
  {type: 'update styles', payload: mixed /* Style Object */} |
  {type: 'update attribute', payload: {[name: string]: string}} |
  {type: 'remove attribute', payload: string}
);

// Trust the developer to only use this with a __DEV__ check
var ReactHostOperationHistoryHook = ((null: any): typeof ReactHostOperationHistoryHook);

if (__DEV__) {
  var history: Array<Operation> = [];

  ReactHostOperationHistoryHook = {
    onHostOperation(operation: Operation) {
      history.push(operation);
    },

    clearHistory(): void {
      if (ReactHostOperationHistoryHook._preventClearing) {
        // Should only be used for tests.
        return;
      }

      history = [];
    },

    getHistory(): Array<Operation> {
      return history;
    },
  };
}

module.exports = ReactHostOperationHistoryHook;
