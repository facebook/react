/* eslint-disable dot-notation */

const COMMENT_NODE = 8;
const SUSPENSE_START_DATA = '$';
const SUSPENSE_END_DATA = '/$';
const SUSPENSE_PENDING_START_DATA = '$?';
const SUSPENSE_FALLBACK_START_DATA = '$!';
const LOADED = 'l';
const ERRORED = 'e';

// TODO: Symbols that are referenced outside this module use dynamic accessor
// notation instead of dot notation to prevent Closure's advanced compilation
// mode from renaming. We could use extern files instead, but I couldn't get it
// working. Closure converts it to a dot access anyway, though, so it's not an
// urgent issue.

export function clientRenderBoundary(
  suspenseBoundaryID,
  errorDigest,
  errorMsg,
  errorComponentStack,
) {
  // Find the fallback's first element.
  const suspenseIdNode = document.getElementById(suspenseBoundaryID);
  if (!suspenseIdNode) {
    // The user must have already navigated away from this tree.
    // E.g. because the parent was hydrated.
    return;
  }
  // Find the boundary around the fallback. This is always the previous node.
  const suspenseNode = suspenseIdNode.previousSibling;
  // Tag it to be client rendered.
  suspenseNode.data = SUSPENSE_FALLBACK_START_DATA;
  // assign error metadata to first sibling
  const dataset = suspenseIdNode.dataset;
  if (errorDigest) dataset['dgst'] = errorDigest;
  if (errorMsg) dataset['msg'] = errorMsg;
  if (errorComponentStack) dataset['stck'] = errorComponentStack;
  // Tell React to retry it if the parent already hydrated.
  if (suspenseNode['_reactRetry']) {
    suspenseNode['_reactRetry']();
  }
}

export function completeBoundaryWithStyles(
  suspenseBoundaryID,
  contentID,
  styles,
) {
  // TODO: In the non-inline version of the runtime, these don't need to be read
  // from the global scope.
  const completeBoundaryImpl = window['$RC'];
  const resourceMap = window['$RM'];

  const precedences = new Map();
  const thisDocument = document;
  let lastResource, node;

  // Seed the precedence list with existing resources
  const nodes = thisDocument.querySelectorAll('link[data-rprec]');
  for (let i = 0; (node = nodes[i++]); ) {
    precedences.set(node.dataset['rprec'], (lastResource = node));
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
    resourceEl.dataset['rprec'] = precedence = style[j++];
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

export function completeBoundary(suspenseBoundaryID, contentID, errorDigest) {
  const contentNode = document.getElementById(contentID);
  // We'll detach the content node so that regardless of what happens next we don't leave in the tree.
  // This might also help by not causing recalcing each time we move a child from here to the target.
  contentNode.parentNode.removeChild(contentNode);

  // Find the fallback's first element.
  const suspenseIdNode = document.getElementById(suspenseBoundaryID);
  if (!suspenseIdNode) {
    // The user must have already navigated away from this tree.
    // E.g. because the parent was hydrated. That's fine there's nothing to do
    // but we have to make sure that we already deleted the container node.
    return;
  }
  // Find the boundary around the fallback. This is always the previous node.
  const suspenseNode = suspenseIdNode.previousSibling;

  if (!errorDigest) {
    // Clear all the existing children. This is complicated because
    // there can be embedded Suspense boundaries in the fallback.
    // This is similar to clearSuspenseBoundary in ReactDOMHostConfig.
    // TODO: We could avoid this if we never emitted suspense boundaries in fallback trees.
    // They never hydrate anyway. However, currently we support incrementally loading the fallback.
    const parentInstance = suspenseNode.parentNode;
    let node = suspenseNode.nextSibling;
    let depth = 0;
    do {
      if (node && node.nodeType === COMMENT_NODE) {
        const data = node.data;
        if (data === SUSPENSE_END_DATA) {
          if (depth === 0) {
            break;
          } else {
            depth--;
          }
        } else if (
          data === SUSPENSE_START_DATA ||
          data === SUSPENSE_PENDING_START_DATA ||
          data === SUSPENSE_FALLBACK_START_DATA
        ) {
          depth++;
        }
      }

      const nextNode = node.nextSibling;
      parentInstance.removeChild(node);
      node = nextNode;
    } while (node);

    const endOfBoundary = node;

    // Insert all the children from the contentNode between the start and end of suspense boundary.
    while (contentNode.firstChild) {
      parentInstance.insertBefore(contentNode.firstChild, endOfBoundary);
    }

    suspenseNode.data = SUSPENSE_START_DATA;
  } else {
    suspenseNode.data = SUSPENSE_FALLBACK_START_DATA;
    suspenseIdNode.setAttribute('data-dgst', errorDigest);
  }

  if (suspenseNode['_reactRetry']) {
    suspenseNode['_reactRetry']();
  }
}

export function completeSegment(containerID, placeholderID) {
  const segmentContainer = document.getElementById(containerID);
  const placeholderNode = document.getElementById(placeholderID);
  // We always expect both nodes to exist here because, while we might
  // have navigated away from the main tree, we still expect the detached
  // tree to exist.
  segmentContainer.parentNode.removeChild(segmentContainer);
  while (segmentContainer.firstChild) {
    placeholderNode.parentNode.insertBefore(
      segmentContainer.firstChild,
      placeholderNode,
    );
  }
  placeholderNode.parentNode.removeChild(placeholderNode);
}
