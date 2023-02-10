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

  const stylesToHoist = new Map();
  const precedences = new Map();
  const thisDocument = document;
  let lastResource, node;

  let nodes = thisDocument.querySelectorAll('template[data-precedence]');
  for (let i = 0; (node = nodes[i++]); ) {
    let child = node.content.firstChild;
    for (; child; child = child.nextSibling) {
      stylesToHoist.set(child.getAttribute('data-href'), child);
    }
    node.parentNode.removeChild(node);
  }

  // Seed the precedence list with existing resources
  nodes = thisDocument.querySelectorAll(
    'link[data-precedence],style[data-precedence]',
  );
  for (let i = 0; (node = nodes[i++]); ) {
    // We populate the resourceMap from found nodes so we can incorporate any
    // resources the client runtime adds when the two runtimes are running concurrently
    resourceMap.set(
      node.getAttribute(node.nodeName === 'STYLE' ? 'data-href' : 'href'),
      node,
    );
    precedences.set(node.dataset['precedence'], (lastResource = node));
  }

  let i = 0;
  const dependencies = [];
  let style, href, precedence, attr, loadingState, resourceEl, media;

  function setStatus(s) {
    this['s'] = s;
  }

  while ((style = styles[i++])) {
    let j = 0;
    href = style[j++];

    if ((resourceEl = resourceMap.get(href))) {
      // We have an already known resource. It could be a <style>, a <link> created
      // by this runtime (which will have a loadingState) or a <link> created by
      // the client runtime (which will also have a loadingState). We look for a
      // loadingState and test whether it is not loaded yet and whether the media matches
      // before using it as a dependency. If it is a <style> there will be no loadingState
      // and we can avoid tracking it as a dependency because these tags don't load
    } else {
      // We haven't already processed this href so we need to hoist an element. It will
      // either be a <style> that was sent in a <template> and prepped in `stylesToHoist`
      // or we will need to create a <link>
      if ((resourceEl = stylesToHoist.get(href))) {
        // We have a <style> which needs to be hoisted to the correct precedence
        // We set it in the resourceMap so we can bail out on future passes
        // if this is depended on more than once
        precedence = resourceEl.getAttribute('data-precedence');
      } else {
        // If we got this far we are depending on a <link> which is not yet in the document.
        // We construct it here and attach a loadingState. We also check whether it matches
        // media before we include it in the dependency array.
        resourceEl = thisDocument.createElement('link');
        resourceEl.href = href;
        resourceEl.rel = 'stylesheet';
        resourceEl.dataset['precedence'] = precedence = style[j++];
        while ((attr = style[j++])) {
          resourceEl.setAttribute(attr, style[j++]);
        }
        loadingState = resourceEl['_p'] = new Promise((re, rj) => {
          resourceEl.onload = re;
          resourceEl.onerror = rj;
        });
        loadingState.then(
          setStatus.bind(loadingState, LOADED),
          setStatus.bind(loadingState, ERRORED),
        );
      }
      // Save this resource element so we can bailout if it is used again
      resourceMap.set(href, resourceEl);

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

    // If we are a <link> we will have a loadingState and we can use this
    // combined with matchMedia to decide if we need to await this dependency
    // loading. <style> tags won't have a loadingState so they are never awaited
    loadingState = resourceEl['_p'];
    media = resourceEl.getAttribute('media');
    if (
      loadingState &&
      loadingState['s'] !== 'l' &&
      (!media || window['matchMedia'](media).matches)
    ) {
      dependencies.push(loadingState);
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
