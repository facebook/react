/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const tabIndexDesc = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'tabIndex',
);
const tabIndexSetter = (tabIndexDesc: any).set;

export default function setElementCanTab(
  elem: HTMLElement,
  canTab: boolean,
): void {
  let tabIndexState = (elem: any)._tabIndexState;
  if (!tabIndexState) {
    tabIndexState = {
      value: elem.tabIndex,
      canTab,
    };
    (elem: any)._tabIndexState = tabIndexState;
    if (!canTab) {
      elem.tabIndex = -1;
    }
    // We track the tabIndex value so we can restore the correct
    // tabIndex after we're done with it.
    // $FlowFixMe: Flow comoplains that we are missing value?
    Object.defineProperty(elem, 'tabIndex', {
      enumerable: false,
      configurable: true,
      get() {
        return tabIndexState.canTab ? tabIndexState.value : -1;
      },
      set(val) {
        if (tabIndexState.canTab) {
          tabIndexSetter.call(elem, val);
        }
        tabIndexState.value = val;
      },
    });
  } else if (tabIndexState.canTab !== canTab) {
    tabIndexSetter.call(elem, canTab ? tabIndexState.value : -1);
    tabIndexState.canTab = canTab;
  }
}
