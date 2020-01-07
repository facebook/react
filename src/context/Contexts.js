// @flow

import { createContext } from 'react';

export type ShowFn = ({| data: Object, pageX: number, pageY: number |}) => void;
export type HideFn = () => void;

const idToShowFnMap = new Map<string, ShowFn>();
const idToHideFnMap = new Map<string, HideFn>();

let currentHideFn = null;
let currentOnChange = null;

function hideMenu() {
  if (typeof currentHideFn === 'function') {
    currentHideFn();

    if (typeof currentOnChange === 'function') {
      currentOnChange(false);
    }
  }

  currentHideFn = null;
  currentOnChange = null;
}

function showMenu({
  data,
  id,
  onChange,
  pageX,
  pageY,
}: {|
  data: Object,
  id: string,
  onChange?: Function,
  pageX: number,
  pageY: number,
|}) {
  const showFn = idToShowFnMap.get(id);
  if (typeof showFn === 'function') {
    currentHideFn = idToHideFnMap.get(id);
    showFn({ data, pageX, pageY });

    if (typeof onChange === 'function') {
      currentOnChange = onChange;
      onChange(true);
    }
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

export const RegistryContext = createContext({
  hideMenu,
  showMenu,
  registerMenu,
});
