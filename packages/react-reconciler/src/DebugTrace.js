/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const pendingGroupNames: Array<string> = [];
let printedGroupIndex: number = -1;

export function group(groupName: string): void {
  //console.info(`group("${groupName}")`);
  pendingGroupNames.push(groupName);
}

export function groupEnd(): void {
  //console.info(`groupEnd("${pendingGroupNames[pendingGroupNames.length-1]}")`);
  pendingGroupNames.pop();
  while (printedGroupIndex >= pendingGroupNames.length) {
    // eslint-disable-next-line react-internal/no-production-logging
    console.groupEnd();
    printedGroupIndex--;
  }
}

export function log(logText: string): void {
  //console.info(`log("${logText}")`);
  if (printedGroupIndex < pendingGroupNames.length - 1) {
    for (let i = printedGroupIndex + 1; i < pendingGroupNames.length; i++) {
      const groupName = pendingGroupNames[i];
      // eslint-disable-next-line react-internal/no-production-logging
      console.group(`⚛️ ${groupName}`);
    }
    printedGroupIndex = pendingGroupNames.length - 1;
  }
  // eslint-disable-next-line react-internal/no-production-logging
  console.log(`⚛️ ${logText}`);
}
