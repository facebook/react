/**
 * Provides a standard way to access a DOM node across all versions of
 * React.
 */

import { reactPaths } from './react-loader';

const React = window.React;

/**
 * Retrieves the DOM node from a React ref.
 * This approach is more aligned with modern React practices.
 * Falls back to `findDOMNode` if necessary, but prefers refs.
 *
 * @param {Object} ref - The React ref to get the DOM node from.
 * @returns {HTMLElement|null} - The DOM node or null if not found.
 */
export function getDOMNode(ref) {
  const { needsReactDOM } = reactPaths();

  if (ref && ref.current) {
    return ref.current;
  }

  if (needsReactDOM) {
    return ReactDOM.findDOMNode(ref);
  }

  return React.findDOMNode(ref);
}
