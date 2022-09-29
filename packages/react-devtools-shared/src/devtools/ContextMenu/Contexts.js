/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactContext} from 'shared/ReactTypes';

import {createContext} from 'react';

export type ShowFn = ({data: Object, pageX: number, pageY: number}) => void;
export type HideFn = () => void;
export type OnChangeFn = boolean => void;

const idToShowFnMap = new Map<string, ShowFn>();
const idToHideFnMap = new Map<string, HideFn>();

let currentHide: ?HideFn = null;
let currentOnChange: ?OnChangeFn = null;

function hideMenu() {
  if (typeof currentHide === 'function') {
    currentHide();

    if (typeof currentOnChange === 'function') {
      currentOnChange(false);
    }
  }

  currentHide = null;
  currentOnChange = null;
}

function showMenu({
  data,
  id,
  onChange,
  pageX,
  pageY,
}: {
  data: Object,
  id: string,
  onChange?: OnChangeFn,
  pageX: number,
  pageY: number,
}) {
  const showFn = idToShowFnMap.get(id);
  if (typeof showFn === 'function') {
    // Prevent open menus from being left hanging.
    hideMenu();

    currentHide = idToHideFnMap.get(id);

    showFn({data, pageX, pageY});

    if (typeof onChange === 'function') {
      currentOnChange = onChange;
      onChange(true);
    }
  }
}

function registerMenu(id: string, showFn: ShowFn, hideFn: HideFn): () => void {
  if (idToShowFnMap.has(id)) {
    throw Error(`Context menu with id "${id}" already registered.`);
  }

  idToShowFnMap.set(id, showFn);
  idToHideFnMap.set(id, hideFn);

  return function unregisterMenu() {
    idToShowFnMap.delete(id);
    idToHideFnMap.delete(id);
  };
}

export type RegistryContextType = {
  hideMenu: typeof hideMenu,
  showMenu: typeof showMenu,
  registerMenu: typeof registerMenu,
};

export const RegistryContext: ReactContext<RegistryContextType> = createContext<RegistryContextType>(
  {
    hideMenu,
    showMenu,
    registerMenu,
  },
);
