/**
 * This file is compiled to a standalone browser script by rollup and loaded by Fizz
 *  clients. Therefore, it should be fast and not have many external dependencies.
 * @flow
 */
/* eslint-disable dot-notation */

// Imports are resolved statically by the closure compiler in release bundles
// and by rollup in jest unit tests
import {
  clientRenderBoundary,
  completeBoundaryWithStyles,
  completeBoundary,
  completeSegment,
} from './fizz-instruction-set/ReactDOMFizzInstructionSet';

if (document.readyState === 'loading') {
  if (!window.$RC) {
    // TODO: Eventually remove, we currently need to set these globals for
    // compatibility with ReactDOMFizzInstructionSet
    window.$RC = completeBoundary;
    window.$RM = new Map();
  }
  const mutationObserver = new MutationObserver(mutations => {
    for (let i = 0; i < mutations.length; i++) {
      const addedNodes = mutations[i].addedNodes;
      for (let j = 0; j < addedNodes.length; j++) {
        if (addedNodes.item(j).parentNode) {
          handleNode(addedNodes.item(j));
        }
      }
    }
  });

  // $FlowFixMe[incompatible-call] document.body should exist at this point
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
  window.addEventListener('DOMContentLoaded', () => {
    mutationObserver.disconnect();
  });
}

const existingNodes = document.getElementsByTagName('template');
for (let i = 0; i < existingNodes.length; i++) {
  handleNode(existingNodes[i]);
}

function handleNode(node_ /*: Node */) {
  // $FlowFixMe[incompatible-cast]
  if (node_.nodeType !== 1 || !(node_ /*: HTMLElement*/).dataset) {
    return;
  }
  // $FlowFixMe[incompatible-cast]
  const node = (node_ /*: HTMLElement*/);
  const dataset = node.dataset;
  if (dataset['rxi'] != null) {
    clientRenderBoundary(
      dataset['sid'],
      dataset['dgst'],
      dataset['msg'],
      dataset['stck'],
    );
    node.remove();
  } else if (dataset['rri'] != null) {
    // Convert styles here, since its type is Array<Array<string>>
    completeBoundaryWithStyles(
      dataset['bid'],
      dataset['sid'],
      JSON.parse(dataset['sty']),
    );
    node.remove();
  } else if (dataset['rci'] != null) {
    completeBoundary(dataset['bid'], dataset['sid']);
    node.remove();
  } else if (dataset['rsi'] != null) {
    completeSegment(dataset['sid'], dataset['pid']);
    node.remove();
  }
}
