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
  suspenseBoundaryID,
  contentID,
  styles,
) {
  const completeBoundaryImpl = window['$RC'];
  const resourceMap = window['$RM'];

  const precedences = new Map();
  const thisDocument = document;
  let lastResource, node;

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
    resourceMap.set(
      node.getAttribute(node.nodeName === 'STYLE' ? 'data-href' : 'href'),
      node,
    );
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
      if (resourceEl['_p']) {
        if (resourceEl['_p']['s'] !== 'l') {
          dependencies.push(resourceEl['_p']);
        }
        continue;
      } else {
        // We assume <style> since all links should have a loading state if they are in
        // the resourceMap.  We mark the style as loaded so we can bail out on a future pass without rehoisting
        resourceEl['_p'] = {s: 'l'};
      }
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
      resourceMap.set(href, resourceEl);
      loadingState = resourceEl['_p'] = new Promise((re, rj) => {
        resourceEl.onload = re;
        resourceEl.onerror = rj;
      });
      loadingState.then(
        setStatus.bind(loadingState, LOADED),
        setStatus.bind(loadingState, ERRORED),
      );
      dependencies.push(loadingState);
    }

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
    completeBoundaryImpl.bind(null, suspenseBoundaryID, contentID, ''),
    completeBoundaryImpl.bind(
      null,
      suspenseBoundaryID,
      contentID,
      'Resource failed to load',
    ),
  );
}
