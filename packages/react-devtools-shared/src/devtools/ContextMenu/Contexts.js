import {createContext} from 'react';

export type ShowFn = ({data: Object, pageX: number, pageY: number}) => void;
export type HideFn = () => void;

const idToShowFnMap = new Map();
const idToHideFnMap = new Map();

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
    idToShowFnMap.delete(id, showFn);
    idToHideFnMap.delete(id, hideFn);
  };
}

export const RegistryContext = createContext({
  hideMenu,
  showMenu,
  registerMenu,
});
