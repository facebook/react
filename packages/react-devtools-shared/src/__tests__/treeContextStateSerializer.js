import {printStore} from 'react-devtools-shared/src/devtools/utils';

// test() is part of Jest's serializer API
export function test(maybeState) {
  if (maybeState === null || typeof maybeState !== 'object') {
    return false;
  }

  // Duck typing at its finest.
  return (
    maybeState.hasOwnProperty('inspectedElementID') &&
    maybeState.hasOwnProperty('ownerFlatTree') &&
    maybeState.hasOwnProperty('ownerSubtreeLeafElementID')
  );
}

// print() is part of Jest's serializer API
export function print(state, serialize, indent) {
  // This is a big of a hack but it works around having to pass in a meta object e.g. {store, state}.
  // DevTools tests depend on a global Store object anyway (initialized via setupTest).
  const store = global.store;

  return printStore(store, false, state);
}
