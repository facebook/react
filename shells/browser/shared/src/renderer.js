/**
 * Install the hook on window, which is an event emitter.
 * Note because Chrome content scripts cannot directly modify the window object,
 * we are evaling this function by inserting a script tag.
 * That's why we have to inline the whole event emitter implementation here.
 *
 * @flow
 */

import { attach } from 'src/backend/renderer';

Object.defineProperty(
  window,
  '__REACT_DEVTOOLS_ATTACH__',
  ({
    enumerable: false,
    get() {
      return attach;
    },
  }: Object)
);
