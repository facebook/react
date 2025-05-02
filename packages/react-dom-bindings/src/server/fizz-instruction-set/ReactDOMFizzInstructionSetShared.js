/* eslint-disable dot-notation */

// Shared implementation and constants between the inline script and external
// runtime instruction sets.

const COMMENT_NODE = 8;
const ACTIVITY_START_DATA = '&';
const ACTIVITY_END_DATA = '/&';
const SUSPENSE_START_DATA = '$';
const SUSPENSE_END_DATA = '/$';
const SUSPENSE_PENDING_START_DATA = '$?';
const SUSPENSE_QUEUED_START_DATA = '$~';
const SUSPENSE_FALLBACK_START_DATA = '$!';

// TODO: Symbols that are referenced outside this module use dynamic accessor
// notation instead of dot notation to prevent Closure's advanced compilation
// mode from renaming. We could use extern files instead, but I couldn't get it
// working. Closure converts it to a dot access anyway, though, so it's not an
// urgent issue.

export function clientRenderBoundary(
  suspenseBoundaryID,
  errorDigest,
  errorMsg,
  errorStack,
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
  if (errorStack) dataset['stck'] = errorStack;
  if (errorComponentStack) dataset['cstck'] = errorComponentStack;
  // Tell React to retry it if the parent already hydrated.
  if (suspenseNode['_reactRetry']) {
    suspenseNode['_reactRetry']();
  }
}

const FALLBACK_THROTTLE_MS = 300;

export function completeBoundary(suspenseBoundaryID, contentID) {
  const contentNodeOuter = document.getElementById(contentID);
  if (!contentNodeOuter) {
    // If the client has failed hydration we may have already deleted the streaming
    // segments. The server may also have emitted a complete instruction but cancelled
    // the segment. Regardless we can ignore this case.
    return;
  }
  // We'll detach the content node so that regardless of what happens next we don't leave in the tree.
  // This might also help by not causing recalcing each time we move a child from here to the target.
  contentNodeOuter.parentNode.removeChild(contentNodeOuter);

  // Find the fallback's first element.
  const suspenseIdNodeOuter = document.getElementById(suspenseBoundaryID);
  if (!suspenseIdNodeOuter) {
    // The user must have already navigated away from this tree.
    // E.g. because the parent was hydrated. That's fine there's nothing to do
    // but we have to make sure that we already deleted the container node.
    return;
  }

  function revealCompletedBoundaries() {
    window['$RT'] = performance.now();
    const batch = window['$RB'];
    window['$RB'] = [];
    for (let i = 0; i < batch.length; i += 2) {
      const suspenseIdNode = batch[i];
      const contentNode = batch[i + 1];

      // Clear all the existing children. This is complicated because
      // there can be embedded Suspense boundaries in the fallback.
      // This is similar to clearSuspenseBoundary in ReactFiberConfigDOM.
      // TODO: We could avoid this if we never emitted suspense boundaries in fallback trees.
      // They never hydrate anyway. However, currently we support incrementally loading the fallback.
      const parentInstance = suspenseIdNode.parentNode;
      if (!parentInstance) {
        // We may have client-rendered this boundary already. Skip it.
        continue;
      }

      // Find the boundary around the fallback. This is always the previous node.
      const suspenseNode = suspenseIdNode.previousSibling;

      let node = suspenseIdNode;
      let depth = 0;
      do {
        if (node && node.nodeType === COMMENT_NODE) {
          const data = node.data;
          if (data === SUSPENSE_END_DATA || data === ACTIVITY_END_DATA) {
            if (depth === 0) {
              break;
            } else {
              depth--;
            }
          } else if (
            data === SUSPENSE_START_DATA ||
            data === SUSPENSE_PENDING_START_DATA ||
            data === SUSPENSE_QUEUED_START_DATA ||
            data === SUSPENSE_FALLBACK_START_DATA ||
            data === ACTIVITY_START_DATA
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
      if (suspenseNode['_reactRetry']) {
        suspenseNode['_reactRetry']();
      }
    }
  }

  // Mark this Suspense boundary as queued so we know not to client render it
  // at the end of document load.
  const suspenseNodeOuter = suspenseIdNodeOuter.previousSibling;
  suspenseNodeOuter.data = SUSPENSE_QUEUED_START_DATA;
  // Queue this boundary for the next batch
  window['$RB'].push(suspenseIdNodeOuter, contentNodeOuter);

  if (window['$RB'].length === 2) {
    // This is the first time we've pushed to the batch. We need to schedule a callback
    // to flush the batch. This is delayed by the throttle heuristic.
    const globalMostRecentFallbackTime =
      typeof window['$RT'] !== 'number' ? 0 : window['$RT'];
    const msUntilTimeout =
      globalMostRecentFallbackTime + FALLBACK_THROTTLE_MS - performance.now();
    // We always schedule the flush in a timer even if it's very low or negative to allow
    // for multiple completeBoundary calls that are already queued to have a chance to
    // make the batch.
    setTimeout(revealCompletedBoundaries, msUntilTimeout);
  }
}

export function completeBoundaryWithStyles(
  suspenseBoundaryID,
  contentID,
  stylesheetDescriptors,
) {
  const precedences = new Map();
  const thisDocument = document;
  let lastResource, node;

  // Seed the precedence list with existing resources and collect hoistable style tags
  const nodes = thisDocument.querySelectorAll(
    'link[data-precedence],style[data-precedence]',
  );
  const styleTagsToHoist = [];
  for (let i = 0; (node = nodes[i++]); ) {
    if (node.getAttribute('media') === 'not all') {
      styleTagsToHoist.push(node);
    } else {
      if (node.tagName === 'LINK') {
        window['$RM'].set(node.getAttribute('href'), node);
      }
      precedences.set(node.dataset['precedence'], (lastResource = node));
    }
  }

  let i = 0;
  const dependencies = [];
  let href, precedence, attr, loadingState, resourceEl, media;

  function cleanupWith(cb) {
    this['_p'] = null;
    cb();
  }

  // Sheets Mode
  let sheetMode = true;
  while (true) {
    if (sheetMode) {
      // Sheet Mode iterates over the stylesheet arguments and constructs them if new or checks them for
      // dependency if they already existed
      const stylesheetDescriptor = stylesheetDescriptors[i++];
      if (!stylesheetDescriptor) {
        // enter <style> Mode
        sheetMode = false;
        i = 0;
        continue;
      }

      let avoidInsert = false;
      let j = 0;
      href = stylesheetDescriptor[j++];

      if ((resourceEl = window['$RM'].get(href))) {
        // We have an already inserted stylesheet.
        loadingState = resourceEl['_p'];
        avoidInsert = true;
      } else {
        // We haven't already processed this href so we need to construct a stylesheet and hoist it
        // We construct it here and attach a loadingState. We also check whether it matches
        // media before we include it in the dependency array.
        resourceEl = thisDocument.createElement('link');
        resourceEl.href = href;
        resourceEl.rel = 'stylesheet';
        resourceEl.dataset['precedence'] = precedence =
          stylesheetDescriptor[j++];
        while ((attr = stylesheetDescriptor[j++])) {
          resourceEl.setAttribute(attr, stylesheetDescriptor[j++]);
        }
        loadingState = resourceEl['_p'] = new Promise((resolve, reject) => {
          resourceEl.onload = cleanupWith.bind(resourceEl, resolve);
          resourceEl.onerror = cleanupWith.bind(resourceEl, reject);
        });
        // Save this resource element so we can bailout if it is used again
        window['$RM'].set(href, resourceEl);
      }
      media = resourceEl.getAttribute('media');
      if (loadingState && (!media || window['matchMedia'](media).matches)) {
        dependencies.push(loadingState);
      }
      if (avoidInsert) {
        // We have a link that is already in the document. We don't want to fall through to the insert path
        continue;
      }
    } else {
      // <style> mode iterates over not-yet-hoisted <style> tags with data-precedence and hoists them.
      resourceEl = styleTagsToHoist[i++];
      if (!resourceEl) {
        // we are done with all style tags
        break;
      }

      precedence = resourceEl.getAttribute('data-precedence');
      resourceEl.removeAttribute('media');
    }

    // resourceEl is either a newly constructed <link rel="stylesheet" ...> or a <style> tag requiring hoisting
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

  const suspenseIdNodeOuter = document.getElementById(suspenseBoundaryID);
  if (suspenseIdNodeOuter) {
    // Mark this Suspense boundary as queued so we know not to client render it
    // at the end of document load.
    const suspenseNodeOuter = suspenseIdNodeOuter.previousSibling;
    suspenseNodeOuter.data = SUSPENSE_QUEUED_START_DATA;
  }

  Promise.all(dependencies).then(
    window['$RC'].bind(null, suspenseBoundaryID, contentID),
    window['$RX'].bind(null, suspenseBoundaryID, 'CSS failed to load'),
  );
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

// This is the exact URL string we expect that Fizz renders if we provide a function action.
// We use this for hydration warnings. It needs to be in sync with Fizz. Maybe makes sense
// as a shared module for that reason.
const EXPECTED_FORM_ACTION_URL =
  // eslint-disable-next-line no-script-url
  "javascript:throw new Error('React form unexpectedly submitted.')";

export function listenToFormSubmissionsForReplaying() {
  // A global replay queue ensures actions are replayed in order.
  // This event listener should be above the React one. That way when
  // we preventDefault in React's handling we also prevent this event
  // from queing it. Since React listens to the root and the top most
  // container you can use is the document, the window is fine.
  // eslint-disable-next-line no-restricted-globals
  addEventListener('submit', event => {
    if (event.defaultPrevented) {
      // We let earlier events to prevent the action from submitting.
      return;
    }
    const form = event.target;
    const submitter = event['submitter'];
    let action = form.action;
    let formDataSubmitter = submitter;
    if (submitter) {
      const submitterAction = submitter.getAttribute('formAction');
      if (submitterAction != null) {
        // The submitter overrides the action.
        action = submitterAction;
        // If the submitter overrides the action, and it passes the test below,
        // that means that it was a function action which conceptually has no name.
        // Therefore, we exclude the submitter from the formdata.
        formDataSubmitter = null;
      }
    }
    if (action !== EXPECTED_FORM_ACTION_URL) {
      // The form is a regular form action, we can bail.
      return;
    }

    // Prevent native navigation.
    // This will also prevent other React's on the same page from listening.
    event.preventDefault();

    // Take a snapshot of the FormData at the time of the event.
    let formData;
    if (formDataSubmitter) {
      // The submitter's value should be included in the FormData.
      // It should be in the document order in the form.
      // Since the FormData constructor invokes the formdata event it also
      // needs to be available before that happens so after construction it's too
      // late. We use a temporary fake node for the duration of this event.
      // TODO: FormData takes a second argument that it's the submitter but this
      // is fairly new so not all browsers support it yet. Switch to that technique
      // when available.
      const temp = document.createElement('input');
      temp.name = formDataSubmitter.name;
      temp.value = formDataSubmitter.value;
      formDataSubmitter.parentNode.insertBefore(temp, formDataSubmitter);
      formData = new FormData(form);
      temp.parentNode.removeChild(temp);
    } else {
      formData = new FormData(form);
    }

    // Queue for replaying later. This field could potentially be shared with multiple
    // Reacts on the same page since each one will preventDefault for the next one.
    // This means that this protocol is shared with any React version that shares the same
    // javascript: URL placeholder value. So we might not be the first to declare it.
    // We attach it to the form's root node, which is the shared environment context
    // where we preserve sequencing and where we'll pick it up from during hydration.
    // If there's no ownerDocument, then this is the document.
    const root = form.ownerDocument || form;
    (root['$$reactFormReplay'] = root['$$reactFormReplay'] || []).push(
      form,
      submitter,
      formData,
    );
  });
}
