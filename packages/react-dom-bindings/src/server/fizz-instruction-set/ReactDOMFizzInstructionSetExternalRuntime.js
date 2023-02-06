/* eslint-disable dot-notation */

// Instruction set for the Fizz external runtime

import {
  clientRenderBoundary,
  completeBoundary,
  completeSegment,
  LOADED,
  ERRORED,
} from './ReactDOMFizzInstructionSetShared';

export {clientRenderBoundary, completeBoundary, completeSegment};

const resourceMap = new Map();

// This function is almost identical to the version used by inline scripts
// (ReactDOMFizzInstructionSetInlineSource), with the exception of how we read
// completeBoundary and resourceMap
export function completeBoundaryWithStyles(
  suspenseBoundaryID,
  contentID,
  styles,
) {
  const precedences = new Map();
  const thisDocument = document;
  let lastResource, node;

  // move any inline styles into the document so they can be hoisted
  let nodes = thisDocument.querySelectorAll('template[data-precedence]');
  for (let i = 0; (node = nodes[i++]); ) {
    let content = node.content;
    let child = content.firstChild;
    for (let j = 0; child; child = child.nextSibling) {
      resourceMap.set(child.getAttribute('data-href'), child);
    }
    node.parentNode.removeChild(node);
  }

  // Seed the precedence list with existing resources
  nodes = thisDocument.querySelectorAll(
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
    resourceEl = resourceMap.get(href);
    if (resourceEl) {
      const loadingState = resourceEl['_p'];
      if (loadingState) {
        if (loadingState['s'] !== 'l') {
          dependencies.push(loadingState);
        }
        continue;
      }
      // If we didn't continue above then this resourceEl must be a <style> inside a <template>
      // awaiting hoisting to the correct precedence. Since this resource type does
      // not load we avoid tracking the loading state and just do the placement
    } else {
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
      loadingState = resourceEl['_p'] = new Promise((re, rj) => {
        resourceEl.onload = re;
        resourceEl.onerror = rj;
      });
      loadingState.then(
        setStatus.bind(loadingState, LOADED),
        setStatus.bind(loadingState, ERRORED),
      );
      resourceMap.set(href, loadingState);
      dependencies.push(loadingState);
    }

    console.log('resourceEL', resourceEl.outerHTML);

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
    completeBoundary.bind(null, suspenseBoundaryID, contentID, ''),
    completeBoundary.bind(
      null,
      suspenseBoundaryID,
      contentID,
      'Resource failed to load',
    ),
  );
}
