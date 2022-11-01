/**
 * This file is compiled to a standalone browser script by rollup and loaded by Fizz
 *  clients. Therefore, it should be fast and not have many external dependencies.
 * @flow
 */

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
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(handleNode);
    });
  });
  // $FlowFixMe[incompatible-call] document.body should exist at this point
  window.$REACT_FIZZ_OBSERVER.observe(document.body, {
    childList: true,
    subtree: true,
  });

  const existingNodes = document.getElementsByTagName('div');
  for (let i = 0; i < existingNodes.length; i++) {
    handleNode(existingNodes[i]);
  }
}

function handleNode(node /*: Node */) {
  if (node.nodeType !== 1) {
    return;
  }
  // $FlowFixMe[incompatible-cast]
  const dataset = (node /*: HTMLElement*/).dataset;
  const instr = dataset ? dataset[':fi'] : null;
  switch (instr) {
    case '$RX':
      clientRenderBoundary(
        dataset[':a0'],
        dataset[':a1'],
        dataset[':a2'],
        dataset[':a3'],
      );
      break;
    case '$RR':
      // Convert arg2 here, since its type is Array<Array<string>>
      completeBoundaryWithStyles(
        dataset[':a0'],
        dataset[':a1'],
        JSON.parse(dataset[':a2']),
      );
      break;
    case '$RC':
      completeBoundary(dataset[':a0'], dataset[':a1'], dataset[':a2']);
      break;
    case '$RS':
      completeSegment(dataset[':a0'], dataset[':a1']);
      break;
  }
}
