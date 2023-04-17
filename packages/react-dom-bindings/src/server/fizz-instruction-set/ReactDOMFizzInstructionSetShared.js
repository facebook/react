/* eslint-disable dot-notation */

// Shared implementation and constants between the inline script and external
// runtime instruction sets.

export const COMMENT_NODE = 8;
export const SUSPENSE_START_DATA = '$';
export const SUSPENSE_END_DATA = '/$';
export const SUSPENSE_PENDING_START_DATA = '$?';
export const SUSPENSE_FALLBACK_START_DATA = '$!';

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
