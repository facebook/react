/* eslint-disable dot-notation */

// Instruction set for Fizz inline scripts.
// DO NOT DIRECTLY IMPORT THIS FILE. This is the source for the compiled and
// minified code in ReactDOMFizzInstructionSetInlineCodeStrings.

import {
  clientRenderBoundary,
  completeBoundary,
  completeSegment,
  LOADED,
  ERRORED,
} from './ReactDOMFizzInstructionSetShared';

export {clientRenderBoundary, completeBoundary, completeSegment};

// This function is almost identical to the version used by the external
// runtime (ReactDOMFizzInstructionSetExternalRuntime), with the exception of
// how we read completeBoundaryImpl and resourceMap
export function completeBoundaryWithStyles(
  completionFn,
  suspenseBoundaryID,
  contentID,
  styles,
) {
  const resourceMap = window['$RM'];

  const precedences = new Map();
  const thisDocument = document;
  let lastResource, node;

  // Seed the precedence list with existing resources
  const nodes = thisDocument.querySelectorAll(
    'link[data-precedence],style[data-precedence]',
  );
  for (let i = 0; (node = nodes[i++]); ) {
    precedences.set(node.dataset['precedence'], (lastResource = node));
  }

  let i = 0;
  const dependencies = [];
  let style, href, precedence, attr, loadingState, resourceEl;

  function setStatus(s) {
    this['s'] = s;
  }

  while ((style = styles[i++])) {
    let j = 0;
    href = style[j++];
    // We check if this resource is already in our resourceMap and reuse it if so.
    // If it is already loaded we don't return it as a depenendency since there is nothing
    // to wait for
    loadingState = resourceMap.get(href);
    if (loadingState) {
      if (loadingState['s'] !== 'l') {
        dependencies.push(loadingState);
      }
      continue;
    }

    // We construct our new resource element, looping over remaining attributes if any
    // setting them to the Element.
    resourceEl = thisDocument.createElement('link');
    resourceEl.href = href;
    resourceEl.rel = 'stylesheet';
    resourceEl.dataset['precedence'] = precedence = style[j++];
    while ((attr = style[j++])) {
      resourceEl.setAttribute(attr, style[j++]);
    }

    // We stash a pending promise in our map by href which will resolve or reject
    // when the underlying resource loads or errors. We add it to the dependencies
    // array to be returned.
    loadingState = resourceEl['_r'] = new Promise((re, rj) => {
      resourceEl.onload = re;
      resourceEl.onerror = rj;
    });
    loadingState.then(
      setStatus.bind(loadingState, LOADED),
      setStatus.bind(loadingState, ERRORED),
    );
    resourceMap.set(href, loadingState);
    dependencies.push(loadingState);

    // The prior style resource is the last one placed at a given
    // precedence or the last resource itself which may be null.
    // We grab this value and then update the last resource for this
    // precedence to be the inserted element, updating the lastResource
    // pointer if needed.
    const prior = precedences.get(precedence) || lastResource;
    if (prior === lastResource) {
      lastResource = resourceEl;
    }
    precedences.set(precedence, resourceEl);

    // Finally, we insert the newly constructed instance at an appropriate location
    // in the Document.
    if (prior) {
      prior.parentNode.insertBefore(resourceEl, prior.nextSibling);
    } else {
      const head = thisDocument.head;
      head.insertBefore(resourceEl, head.firstChild);
    }
  }

  Promise.all(dependencies).then(
    completionFn.bind(null, suspenseBoundaryID, contentID, ''),
    completionFn.bind(
      null,
      suspenseBoundaryID,
      contentID,
      'Stylesheet failed to load.',
    ),
  );
}

export function completeContainer(containerID, contentID) {
  const thisDocument = document;
  try {
    const contentNode = thisDocument.getElementById(contentID);
    // We'll detach the content node so that regardless of what happens next we don't leave in the tree.
    // This might also help by not causing recalcing each time we move a child from here to the target.
    contentNode.parentNode.removeChild(contentNode);

    // Find the container node.
    const containerNode = thisDocument.getElementById(containerID);
    if (!containerNode) {
      // The user must have already navigated away from this tree.
      // E.g. because the parent was hydrated. That's fine there's nothing to do
      // but we have to make sure that we already deleted the container node.
      return;
    }

    // This is a container insertion. we clear simply clear the container
    containerNode.textContent = '';

    // Insert all the children from the contentNode between the start and end of suspense boundary.
    while (contentNode.firstChild) {
      containerNode.appendChild(contentNode.firstChild);
    }
  } finally {
    const bootstrapNode = thisDocument.getElementById('bs:' + contentID);
    if (bootstrapNode) {
      thisDocument.body.appendChild(bootstrapNode.content);
      bootstrapNode.parentNode.removeChild(bootstrapNode);
    }
  }
}
