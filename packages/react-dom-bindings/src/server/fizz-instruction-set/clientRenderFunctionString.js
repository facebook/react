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

// TODO: Generate this file with a build step.
export default 'function $RX(b,c,d,e){var a=document.getElementById(b);a&&(b=a.previousSibling,b.data="$!",a=a.dataset,c&&(a.dgst=c),d&&(a.msg=d),e&&(a.stck=e),b._reactRetry&&b._reactRetry())}';
