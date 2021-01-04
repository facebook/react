/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createContext} from 'react';

export type ShowFn = ({|data: Object, pageX: number, pageY: number|}) => void;
export type HideFn = () => void;

const idToShowFnMap = new Map<string, ShowFn>();
const idToHideFnMap = new Map<string, HideFn>();

let currentHideFn = null;

function hideMenu() {
  if (typeof currentHideFn === 'function') {
    currentHideFn();
  }
}

function showMenu({
  data,
  id,
  pageX,
  pageY,
}: {|
  data: Object,
  id: string,
  pageX: number,
  pageY: number,
|}) {
  const showFn = idToShowFnMap.get(id);
  if (typeof showFn === 'function') {
    currentHideFn = idToHideFnMap.get(id);
    showFn({data, pageX, pageY});
  }
}

function registerMenu(id: string, showFn: ShowFn, hideFn: HideFn) {
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

export type RegistryContextType = {|
  hideMenu: () => void,
  showMenu: ({|
    data: Object,
    id: string,
    pageX: number,
    pageY: number,
  |}) => void,
  registerMenu: (string, ShowFn, HideFn) => Function,
|};

export const RegistryContext = createContext<RegistryContextType>({
  hideMenu,
  showMenu,
  registerMenu,
});
