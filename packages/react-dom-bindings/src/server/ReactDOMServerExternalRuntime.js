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

// This runtime may be sent to the client multiple times (if FizzServer.render
//  is called more than once). Here, we check whether the mutation observer
//  was already created / installed
if (!window.$REACT_FIZZ_OBSERVER) {
  // TODO: Eventually remove, we currently need to set these globals for
  // compatibility with ReactDOMFizzInstructionSet
  window.$RC = completeBoundary;
  window.$RM = new Map();
  window.$REACT_FIZZ_OBSERVER = new MutationObserver(mutations => {
    for (let i = 0; i < mutations.length; i++) {
      const addedNodes = mutations[i].addedNodes;
      for (let j = 0; j < addedNodes.length; j++) {
        handleNode(addedNodes.item(j));
      }
    }
  });
  // $FlowFixMe[incompatible-call] document.body should exist at this point
  window.$REACT_FIZZ_OBSERVER.observe(document.body, {
    childList: true,
    subtree: true,
  });

  const existingNodes = document.getElementsByTagName('template');
  for (let i = 0; i < existingNodes.length; i++) {
    handleNode(existingNodes[i]);
  }
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
