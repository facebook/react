// Instruction Set

// The following code is the source scripts that we then minify and inline below,
// with renamed function names that we hope don't collide:

// const COMMENT_NODE = 8;
// const SUSPENSE_START_DATA = '$';
// const SUSPENSE_END_DATA = '/$';
// const SUSPENSE_PENDING_START_DATA = '$?';
// const SUSPENSE_FALLBACK_START_DATA = '$!';
// const LOADED = 'l';
// const ERRORED = 'e';

// function clientRenderBoundary(suspenseBoundaryID, errorDigest, errorMsg, errorComponentStack) {
//   // Find the fallback's first element.
//   const suspenseIdNode = document.getElementById(suspenseBoundaryID);
//   if (!suspenseIdNode) {
//     // The user must have already navigated away from this tree.
//     // E.g. because the parent was hydrated.
//     return;
//   }
//   // Find the boundary around the fallback. This is always the previous node.
//   const suspenseNode = suspenseIdNode.previousSibling;
//   // Tag it to be client rendered.
//   suspenseNode.data = SUSPENSE_FALLBACK_START_DATA;
//   // assign error metadata to first sibling
//   let dataset = suspenseIdNode.dataset;
//   if (errorDigest) dataset.dgst = errorDigest;
//   if (errorMsg) dataset.msg = errorMsg;
//   if (errorComponentStack) dataset.stck = errorComponentStack;
//   // Tell React to retry it if the parent already hydrated.
//   if (suspenseNode._reactRetry) {
//     suspenseNode._reactRetry();
//   }
// }

// resourceMap = new Map();
// function completeBoundaryWithStyles(suspenseBoundaryID, contentID, styles) {
//   const precedences = new Map();
//   const thisDocument = document;
//   let lastResource, node;

//   // Seed the precedence list with existing resources
//   let nodes = thisDocument.querySelectorAll('link[data-rprec]');
//   for (let i = 0;node = nodes[i++];) {
//     precedences.set(node.dataset.rprec, lastResource = node);
//   }

//   let i = 0;
//   let dependencies = [];
//   let style, href, precedence, attr, loadingState, resourceEl;

//   function setStatus(s) {
//     this.s = s;
//   }

//   while (style = styles[i++]) {
//     let j = 0;
//     href = style[j++];
//     // We check if this resource is already in our resourceMap and reuse it if so.
//     // If it is already loaded we don't return it as a depenendency since there is nothing
//     // to wait for
//     loadingState = resourceMap.get(href);
//     if (loadingState) {
//       if (loadingState.s !== 'l') {
//         dependencies.push(loadingState);
//       }
//       continue;
//     }

//     // We construct our new resource element, looping over remaining attributes if any
//     // setting them to the Element.
//     resourceEl = thisDocument.createElement("link");
//     resourceEl.href = href;
//     resourceEl.rel = 'stylesheet';
//     resourceEl.dataset.rprec = precedence = style[j++];
//     while(attr = style[j++]) {
//       resourceEl.setAttribute(attr, style[j++]);
//     }

//     // We stash a pending promise in our map by href which will resolve or reject
//     // when the underlying resource loads or errors. We add it to the dependencies
//     // array to be returned.
//     loadingState = resourceEl._p = new Promise((re, rj) => {
//       resourceEl.onload = re;
//       resourceEl.onerror = rj;
//     })
//     loadingState.then(
//       setStatus.bind(loadingState, LOADED),
//       setStatus.bind(loadingState, ERRORED)
//     );
//     resourceMap.set(href, loadingState);
//     dependencies.push(loadingState);

//     // The prior style resource is the last one placed at a given
//     // precedence or the last resource itself which may be null.
//     // We grab this value and then update the last resource for this
//     // precedence to be the inserted element, updating the lastResource
//     // pointer if needed.
//     let prior = precedences.get(precedence) || lastResource;
//     if (prior === lastResource) {
//       lastResource = resourceEl
//     }
//     precedences.set(precedence, resourceEl)

//     // Finally, we insert the newly constructed instance at an appropriate location
//     // in the Document.
//     if (prior) {
//       prior.parentNode.insertBefore(resourceEl, prior.nextSibling);
//     } else {
//       let head = thisDocument.head;
//       head.insertBefore(resourceEl, head.firstChild);
//     }
//   }

//   Promise.all(dependencies).then(
//     completeBoundary.bind(null, suspenseBoundaryID, contentID, ''),
//     completeBoundary.bind(null, suspenseBoundaryID, contentID, "Resource failed to load")
//   );
// }

// function completeBoundary(suspenseBoundaryID, contentID, errorDigest) {
//   const contentNode = document.getElementById(contentID);
//   // We'll detach the content node so that regardless of what happens next we don't leave in the tree.
//   // This might also help by not causing recalcing each time we move a child from here to the target.
//   contentNode.parentNode.removeChild(contentNode);

//   // Find the fallback's first element.
//   const suspenseIdNode = document.getElementById(suspenseBoundaryID);
//   if (!suspenseIdNode) {
//     // The user must have already navigated away from this tree.
//     // E.g. because the parent was hydrated. That's fine there's nothing to do
//     // but we have to make sure that we already deleted the container node.
//     return;
//   }
//   // Find the boundary around the fallback. This is always the previous node.
//   const suspenseNode = suspenseIdNode.previousSibling;

//   if (!errorDigest) {
//     // Clear all the existing children. This is complicated because
//     // there can be embedded Suspense boundaries in the fallback.
//     // This is similar to clearSuspenseBoundary in ReactDOMHostConfig.
//     // TODO: We could avoid this if we never emitted suspense boundaries in fallback trees.
//     // They never hydrate anyway. However, currently we support incrementally loading the fallback.
//     const parentInstance = suspenseNode.parentNode;
//     let node = suspenseNode.nextSibling;
//     let depth = 0;
//     do {
//       if (node && node.nodeType === COMMENT_NODE) {
//         const data = node.data;
//         if (data === SUSPENSE_END_DATA) {
//           if (depth === 0) {
//             break;
//           } else {
//             depth--;
//           }
//         } else if (
//           data === SUSPENSE_START_DATA ||
//           data === SUSPENSE_PENDING_START_DATA ||
//           data === SUSPENSE_FALLBACK_START_DATA
//         ) {
//           depth++;
//         }
//       }

//       const nextNode = node.nextSibling;
//       parentInstance.removeChild(node);
//       node = nextNode;
//     } while (node);

//     const endOfBoundary = node;

//     // Insert all the children from the contentNode between the start and end of suspense boundary.
//     while (contentNode.firstChild) {
//       parentInstance.insertBefore(contentNode.firstChild, endOfBoundary);
//     }

//     suspenseNode.data = SUSPENSE_START_DATA;
//   } else {
//     suspenseNode.data = SUSPENSE_FALLBACK_START_DATA;
//     suspenseIdNode.setAttribute('data-dgst', errorDigest)
//   }

//   if (suspenseNode._reactRetry) {
//     suspenseNode._reactRetry();
//   }
// }

// function completeSegment(containerID, placeholderID) {
//   const segmentContainer = document.getElementById(containerID);
//   const placeholderNode = document.getElementById(placeholderID);
//   // We always expect both nodes to exist here because, while we might
//   // have navigated away from the main tree, we still expect the detached
//   // tree to exist.
//   segmentContainer.parentNode.removeChild(segmentContainer);
//   while (segmentContainer.firstChild) {
//     placeholderNode.parentNode.insertBefore(
//       segmentContainer.firstChild,
//       placeholderNode,
//     );
//   }
//   placeholderNode.parentNode.removeChild(placeholderNode);
// }

export const clientRenderBoundary =
  '$RX=function(b,c,d,e){var a=document.getElementById(b);a&&(b=a.previousSibling,b.data="$!",a=a.dataset,c&&(a.dgst=c),d&&(a.msg=d),e&&(a.stck=e),b._reactRetry&&b._reactRetry())};';
export const completeBoundary =
  '$RC=function(b,c,e){c=document.getElementById(c);c.parentNode.removeChild(c);var a=document.getElementById(b);if(a){b=a.previousSibling;if(e)b.data="$!",a.setAttribute("data-dgst",e);else{e=b.parentNode;a=b.nextSibling;var f=0;do{if(a&&8===a.nodeType){var d=a.data;if("/$"===d)if(0===f)break;else f--;else"$"!==d&&"$?"!==d&&"$!"!==d||f++}d=a.nextSibling;e.removeChild(a);a=d}while(a);for(;c.firstChild;)e.insertBefore(c.firstChild,a);b.data="$"}b._reactRetry&&b._reactRetry()}};';
export const completeBoundaryWithStyles =
  '$RM=new Map;\n$RR=function(p,q,v){function r(l){this.s=l}for(var t=$RC,u=$RM,m=new Map,n=document,g,e,f=n.querySelectorAll("link[data-rprec]"),d=0;e=f[d++];)m.set(e.dataset.rprec,g=e);e=0;f=[];for(var c,h,b,a;c=v[e++];){var k=0;h=c[k++];if(b=u.get(h))"l"!==b.s&&f.push(b);else{a=n.createElement("link");a.href=h;a.rel="stylesheet";for(a.dataset.rprec=d=c[k++];b=c[k++];)a.setAttribute(b,c[k++]);b=a._p=new Promise(function(l,w){a.onload=l;a.onerror=w});b.then(r.bind(b,"l"),r.bind(b,"e"));u.set(h,\nb);f.push(b);c=m.get(d)||g;c===g&&(g=a);m.set(d,a);c?c.parentNode.insertBefore(a,c.nextSibling):(d=n.head,d.insertBefore(a,d.firstChild))}}Promise.all(f).then(t.bind(null,p,q,""),t.bind(null,p,q,"Resource failed to load"))};';
export const completeSegment =
  '$RS=function(a,b){a=document.getElementById(a);b=document.getElementById(b);for(a.parentNode.removeChild(a);a.firstChild;)b.parentNode.insertBefore(a.firstChild,b);b.parentNode.removeChild(b)};';
