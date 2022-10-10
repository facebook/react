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

// TODO: Generate this file with a build step.
export default 'function $RC(b,c,d){c=document.getElementById(c);c.parentNode.removeChild(c);var a=document.getElementById(b);if(a){b=a.previousSibling;if(d)b.data="$!",a.setAttribute("data-dgst",d);else{d=b.parentNode;a=b.nextSibling;var e=0;do{if(a&&a.nodeType===8){var h=a.data;if(h==="/$")if(0===e)break;else e--;else h!=="$"&&h!=="$?"&&h!=="$!"||e++}h=a.nextSibling;d.removeChild(a);a=h}while(a);for(;c.firstChild;)d.insertBefore(c.firstChild,a);b.data="$"}b._reactRetry&&b._reactRetry()}}';
