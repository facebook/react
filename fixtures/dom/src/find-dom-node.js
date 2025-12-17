/**
 * Provides a standard way to access a DOM node across all versions of
 * React.
 */

import {reactPaths} from './react-loader';

const React = window.React;
const ReactDOM = window.ReactDOM;

export function findDOMNode(target) {
  const {needsReactDOM} = reactPaths();

  if (needsReactDOM) {
    return ReactDOM.findDOMNode(target);
  } else {
    // eslint-disable-next-line
    return React.findDOMNode(target);
  }
}
