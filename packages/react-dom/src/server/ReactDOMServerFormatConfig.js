/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Destination,
  Chunk,
  PrecomputedChunk,
} from 'react-server/src/ReactServerStreamConfig';

import {
  writeChunk,
  stringToChunk,
  stringToPrecomputedChunk,
} from 'react-server/src/ReactServerStreamConfig';

import escapeTextForBrowser from './escapeTextForBrowser';
import invariant from 'shared/invariant';

// Per response, global state that is not contextual to the rendering subtree.
export type ResponseState = {
  placeholderPrefix: PrecomputedChunk,
  segmentPrefix: PrecomputedChunk,
  boundaryPrefix: string,
  opaqueIdentifierPrefix: PrecomputedChunk,
  nextSuspenseID: number,
  sentCompleteSegmentFunction: boolean,
  sentCompleteBoundaryFunction: boolean,
  sentClientRenderFunction: boolean,
};

// Allows us to keep track of what we've already written so we can refer back to it.
export function createResponseState(
  identifierPrefix: string = '',
): ResponseState {
  return {
    placeholderPrefix: stringToPrecomputedChunk(identifierPrefix + 'P:'),
    segmentPrefix: stringToPrecomputedChunk(identifierPrefix + 'S:'),
    boundaryPrefix: identifierPrefix + 'B:',
    opaqueIdentifierPrefix: stringToPrecomputedChunk(identifierPrefix + 'R:'),
    nextSuspenseID: 0,
    sentCompleteSegmentFunction: false,
    sentCompleteBoundaryFunction: false,
    sentClientRenderFunction: false,
  };
}

// Constants for the insertion mode we're currently writing in. We don't encode all HTML5 insertion
// modes. We only include the variants as they matter for the sake of our purposes.
// We don't actually provide the namespace therefore we use constants instead of the string.
const HTML_MODE = 0;
const SVG_MODE = 1;
const MATHML_MODE = 2;
const HTML_TABLE_MODE = 4;
const HTML_TABLE_BODY_MODE = 5;
const HTML_TABLE_ROW_MODE = 6;
const HTML_COLGROUP_MODE = 7;
// We have a greater than HTML_TABLE_MODE check elsewhere. If you add more cases here, make sure it
// still makes sense

type InsertionMode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

// Lets us keep track of contextual state and pick it back up after suspending.
export type FormatContext = {
  insertionMode: InsertionMode, // root/svg/html/mathml/table
  selectedValue: null | string, // the selected value(s) inside a <select>, or null outside <select>
};

function createFormatContext(
  insertionMode: InsertionMode,
  selectedValue: null | string,
): FormatContext {
  return {
    insertionMode,
    selectedValue,
  };
}

export function createRootFormatContext(namespaceURI?: string): FormatContext {
  const insertionMode =
    namespaceURI === 'http://www.w3.org/2000/svg'
      ? SVG_MODE
      : namespaceURI === 'http://www.w3.org/1998/Math/MathML'
      ? MATHML_MODE
      : HTML_MODE;
  return createFormatContext(insertionMode, null);
}

export function getChildFormatContext(
  parentContext: FormatContext,
  type: string,
  props: Object,
): FormatContext {
  switch (type) {
    case 'select':
      return createFormatContext(
        HTML_MODE,
        props.value != null ? props.value : props.defaultValue,
      );
    case 'svg':
      return createFormatContext(SVG_MODE, null);
    case 'math':
      return createFormatContext(MATHML_MODE, null);
    case 'foreignObject':
      return createFormatContext(HTML_MODE, null);
    // Table parents are special in that their children can only be created at all if they're
    // wrapped in a table parent. So we need to encode that we're entering this mode.
    case 'table':
      return createFormatContext(HTML_TABLE_MODE, null);
    case 'thead':
    case 'tbody':
    case 'tfoot':
      return createFormatContext(HTML_TABLE_BODY_MODE, null);
    case 'colgroup':
      return createFormatContext(HTML_COLGROUP_MODE, null);
    case 'tr':
      return createFormatContext(HTML_TABLE_ROW_MODE, null);
  }
  if (parentContext.insertionMode >= HTML_TABLE_MODE) {
    // Whatever tag this was, it wasn't a table parent or other special parent, so we must have
    // entered plain HTML again.
    return createFormatContext(HTML_MODE, null);
  }
  return parentContext;
}

// This object is used to lazily reuse the ID of the first generated node, or assign one.
// We can't assign an ID up front because the node we're attaching it to might already
// have one. So we need to lazily use that if it's available.
export type SuspenseBoundaryID = {
  formattedID: null | PrecomputedChunk,
};

export function createSuspenseBoundaryID(
  responseState: ResponseState,
): SuspenseBoundaryID {
  return {formattedID: null};
}

function encodeHTMLIDAttribute(value: string): string {
  return escapeTextForBrowser(value);
}

function encodeHTMLTextNode(text: string): string {
  return escapeTextForBrowser(text);
}

function assignAnID(
  responseState: ResponseState,
  id: SuspenseBoundaryID,
): PrecomputedChunk {
  // TODO: This approach doesn't yield deterministic results since this is assigned during render.
  const generatedID = responseState.nextSuspenseID++;
  return (id.formattedID = stringToPrecomputedChunk(
    responseState.boundaryPrefix + generatedID.toString(16),
  ));
}

const dummyNode1 = stringToPrecomputedChunk('<template id="');
const dummyNode2 = stringToPrecomputedChunk('"></template>');

function pushDummyNodeWithID(
  target: Array<Chunk | PrecomputedChunk>,
  responseState: ResponseState,
  assignID: SuspenseBoundaryID,
): void {
  const id = assignAnID(responseState, assignID);
  target.push(dummyNode1, id, dummyNode2);
}

export function pushEmpty(
  target: Array<Chunk | PrecomputedChunk>,
  responseState: ResponseState,
  assignID: null | SuspenseBoundaryID,
): void {
  if (assignID !== null) {
    pushDummyNodeWithID(target, responseState, assignID);
  }
}

const textSeparator = stringToPrecomputedChunk('<!-- -->');

export function pushTextInstance(
  target: Array<Chunk | PrecomputedChunk>,
  text: string,
  responseState: ResponseState,
  assignID: null | SuspenseBoundaryID,
): void {
  if (assignID !== null) {
    pushDummyNodeWithID(target, responseState, assignID);
  }
  if (text === '') {
    // Empty text doesn't have a DOM node representation and the hydration is aware of this.
    return;
  }
  // TODO: Avoid adding a text separator in common cases.
  target.push(stringToChunk(encodeHTMLTextNode(text)), textSeparator);
}

const startTag1 = stringToPrecomputedChunk('<');
const startTag2 = stringToPrecomputedChunk('>');

const idAttr = stringToPrecomputedChunk(' id="');
const attrEnd = stringToPrecomputedChunk('"');

export function pushStartInstance(
  target: Array<Chunk | PrecomputedChunk>,
  type: string,
  props: Object,
  responseState: ResponseState,
  assignID: null | SuspenseBoundaryID,
): void {
  // TODO: Figure out if it's self closing and everything else.
  if (assignID !== null) {
    let encodedID;
    if (typeof props.id === 'string') {
      // We can reuse the existing ID for our purposes.
      encodedID = assignID.formattedID = stringToPrecomputedChunk(
        encodeHTMLIDAttribute(props.id),
      );
    } else {
      encodedID = assignAnID(responseState, assignID);
    }
    target.push(
      startTag1,
      stringToChunk(type),
      idAttr,
      encodedID,
      attrEnd,
      startTag2,
    );
  } else {
    target.push(startTag1, stringToChunk(type));
    if (props.className) {
      target.push(
        stringToChunk(
          ' class="' + encodeHTMLIDAttribute(props.className) + '"',
        ),
      );
    }
    if (props.id) {
      target.push(
        stringToChunk(' id="' + encodeHTMLIDAttribute(props.id) + '"'),
      );
    }
    target.push(startTag2);
  }
}

const endTag1 = stringToPrecomputedChunk('</');
const endTag2 = stringToPrecomputedChunk('>');

export function pushEndInstance(
  target: Array<Chunk | PrecomputedChunk>,
  type: string,
  props: Object,
): void {
  // TODO: Figure out if it was self closing.
  target.push(endTag1, stringToChunk(type), endTag2);
}

// Structural Nodes

// A placeholder is a node inside a hidden partial tree that can be filled in later, but before
// display. It's never visible to users. We use the template tag because it can be used in every
// type of parent. <script> tags also work in every other tag except <colgroup>.
const placeholder1 = stringToPrecomputedChunk('<template id="');
const placeholder2 = stringToPrecomputedChunk('"></template>');
export function writePlaceholder(
  destination: Destination,
  responseState: ResponseState,
  id: number,
): boolean {
  writeChunk(destination, placeholder1);
  writeChunk(destination, responseState.placeholderPrefix);
  const formattedID = stringToChunk(id.toString(16));
  writeChunk(destination, formattedID);
  return writeChunk(destination, placeholder2);
}

// Suspense boundaries are encoded as comments.
const startCompletedSuspenseBoundary = stringToPrecomputedChunk('<!--$-->');
const startPendingSuspenseBoundary = stringToPrecomputedChunk('<!--$?-->');
const startClientRenderedSuspenseBoundary = stringToPrecomputedChunk(
  '<!--$!-->',
);
const endSuspenseBoundary = stringToPrecomputedChunk('<!--/$-->');

export function writeStartCompletedSuspenseBoundary(
  destination: Destination,
  id: SuspenseBoundaryID,
): boolean {
  return writeChunk(destination, startCompletedSuspenseBoundary);
}
export function writeStartPendingSuspenseBoundary(
  destination: Destination,
  id: SuspenseBoundaryID,
): boolean {
  return writeChunk(destination, startPendingSuspenseBoundary);
}
export function writeStartClientRenderedSuspenseBoundary(
  destination: Destination,
  id: SuspenseBoundaryID,
): boolean {
  return writeChunk(destination, startClientRenderedSuspenseBoundary);
}
export function writeEndSuspenseBoundary(destination: Destination): boolean {
  return writeChunk(destination, endSuspenseBoundary);
}

const startSegmentHTML = stringToPrecomputedChunk('<div hidden id="');
const startSegmentHTML2 = stringToPrecomputedChunk('">');
const endSegmentHTML = stringToPrecomputedChunk('</div>');

const startSegmentSVG = stringToPrecomputedChunk(
  '<svg aria-hidden="true" style="display:none" id="',
);
const startSegmentSVG2 = stringToPrecomputedChunk('">');
const endSegmentSVG = stringToPrecomputedChunk('</svg>');

const startSegmentMathML = stringToPrecomputedChunk(
  '<math aria-hidden="true" style="display:none" id="',
);
const startSegmentMathML2 = stringToPrecomputedChunk('">');
const endSegmentMathML = stringToPrecomputedChunk('</math>');

const startSegmentTable = stringToPrecomputedChunk('<table hidden id="');
const startSegmentTable2 = stringToPrecomputedChunk('">');
const endSegmentTable = stringToPrecomputedChunk('</table>');

const startSegmentTableBody = stringToPrecomputedChunk(
  '<table hidden><tbody id="',
);
const startSegmentTableBody2 = stringToPrecomputedChunk('">');
const endSegmentTableBody = stringToPrecomputedChunk('</tbody></table>');

const startSegmentTableRow = stringToPrecomputedChunk('<table hidden><tr id="');
const startSegmentTableRow2 = stringToPrecomputedChunk('">');
const endSegmentTableRow = stringToPrecomputedChunk('</tr></table>');

const startSegmentColGroup = stringToPrecomputedChunk(
  '<table hidden><colgroup id="',
);
const startSegmentColGroup2 = stringToPrecomputedChunk('">');
const endSegmentColGroup = stringToPrecomputedChunk('</colgroup></table>');

export function writeStartSegment(
  destination: Destination,
  responseState: ResponseState,
  formatContext: FormatContext,
  id: number,
): boolean {
  switch (formatContext.insertionMode) {
    case HTML_MODE: {
      writeChunk(destination, startSegmentHTML);
      writeChunk(destination, responseState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunk(destination, startSegmentHTML2);
    }
    case SVG_MODE: {
      writeChunk(destination, startSegmentSVG);
      writeChunk(destination, responseState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunk(destination, startSegmentSVG2);
    }
    case MATHML_MODE: {
      writeChunk(destination, startSegmentMathML);
      writeChunk(destination, responseState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunk(destination, startSegmentMathML2);
    }
    case HTML_TABLE_MODE: {
      writeChunk(destination, startSegmentTable);
      writeChunk(destination, responseState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunk(destination, startSegmentTable2);
    }
    // TODO: For the rest of these, there will be extra wrapper nodes that never
    // get deleted from the document. We need to delete the table too as part
    // of the injected scripts. They are invisible though so it's not too terrible
    // and it's kind of an edge case to suspend in a table. Totally supported though.
    case HTML_TABLE_BODY_MODE: {
      writeChunk(destination, startSegmentTableBody);
      writeChunk(destination, responseState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunk(destination, startSegmentTableBody2);
    }
    case HTML_TABLE_ROW_MODE: {
      writeChunk(destination, startSegmentTableRow);
      writeChunk(destination, responseState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunk(destination, startSegmentTableRow2);
    }
    case HTML_COLGROUP_MODE: {
      writeChunk(destination, startSegmentColGroup);
      writeChunk(destination, responseState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunk(destination, startSegmentColGroup2);
    }
    default: {
      invariant(false, 'Unknown insertion mode. This is a bug in React.');
    }
  }
}
export function writeEndSegment(
  destination: Destination,
  formatContext: FormatContext,
): boolean {
  switch (formatContext.insertionMode) {
    case HTML_MODE: {
      return writeChunk(destination, endSegmentHTML);
    }
    case SVG_MODE: {
      return writeChunk(destination, endSegmentSVG);
    }
    case MATHML_MODE: {
      return writeChunk(destination, endSegmentMathML);
    }
    case HTML_TABLE_MODE: {
      return writeChunk(destination, endSegmentTable);
    }
    case HTML_TABLE_BODY_MODE: {
      return writeChunk(destination, endSegmentTableBody);
    }
    case HTML_TABLE_ROW_MODE: {
      return writeChunk(destination, endSegmentTableRow);
    }
    case HTML_COLGROUP_MODE: {
      return writeChunk(destination, endSegmentColGroup);
    }
    default: {
      invariant(false, 'Unknown insertion mode. This is a bug in React.');
    }
  }
}

// Instruction Set

// The following code is the source scripts that we then minify and inline below,
// with renamed function names that we hope don't collide:

// const COMMENT_NODE = 8;
// const SUSPENSE_START_DATA = '$';
// const SUSPENSE_END_DATA = '/$';
// const SUSPENSE_PENDING_START_DATA = '$?';
// const SUSPENSE_FALLBACK_START_DATA = '$!';
//
// function clientRenderBoundary(suspenseBoundaryID) {
//   // Find the fallback's first element.
//   let suspenseNode = document.getElementById(suspenseBoundaryID);
//   if (!suspenseNode) {
//     // The user must have already navigated away from this tree.
//     // E.g. because the parent was hydrated.
//     return;
//   }
//   // Find the boundary around the fallback. This might include text nodes.
//   do {
//     suspenseNode = suspenseNode.previousSibling;
//   } while (
//     suspenseNode.nodeType !== COMMENT_NODE ||
//     suspenseNode.data !== SUSPENSE_PENDING_START_DATA
//   );
//   // Tag it to be client rendered.
//   suspenseNode.data = SUSPENSE_FALLBACK_START_DATA;
//   // Tell React to retry it if the parent already hydrated.
//   if (suspenseNode._reactRetry) {
//     suspenseNode._reactRetry();
//   }
// }
//
// function completeBoundary(suspenseBoundaryID, contentID) {
//   // Find the fallback's first element.
//   let suspenseNode = document.getElementById(suspenseBoundaryID);
//   const contentNode = document.getElementById(contentID);
//   // We'll detach the content node so that regardless of what happens next we don't leave in the tree.
//   // This might also help by not causing recalcing each time we move a child from here to the target.
//   contentNode.parentNode.removeChild(contentNode);
//   if (!suspenseNode) {
//     // The user must have already navigated away from this tree.
//     // E.g. because the parent was hydrated. That's fine there's nothing to do
//     // but we have to make sure that we already deleted the container node.
//     return;
//   }
//   // Find the boundary around the fallback. This might include text nodes.
//   do {
//     suspenseNode = suspenseNode.previousSibling;
//   } while (
//     suspenseNode.nodeType !== COMMENT_NODE ||
//     suspenseNode.data !== SUSPENSE_PENDING_START_DATA
//   );
//
//   // Clear all the existing children. This is complicated because
//   // there can be embedded Suspense boundaries in the fallback.
//   // This is similar to clearSuspenseBoundary in ReactDOMHostConfig.
//   // TOOD: We could avoid this if we never emitted suspense boundaries in fallback trees.
//   // They never hydrate anyway. However, currently we support incrementally loading the fallback.
//   const parentInstance = suspenseNode.parentNode;
//   let node = suspenseNode.nextSibling;
//   let depth = 0;
//   do {
//     if (node && node.nodeType === COMMENT_NODE) {
//       const data = node.data;
//       if (data === SUSPENSE_END_DATA) {
//         if (depth === 0) {
//           break;
//         } else {
//           depth--;
//         }
//       } else if (
//         data === SUSPENSE_START_DATA ||
//         data === SUSPENSE_PENDING_START_DATA ||
//         data === SUSPENSE_FALLBACK_START_DATA
//       ) {
//         depth++;
//       }
//     }
//
//     const nextNode = node.nextSibling;
//     parentInstance.removeChild(node);
//     node = nextNode;
//   } while (node);
//
//   const endOfBoundary = node;
//
//   // Insert all the children from the contentNode between the start and end of suspense boundary.
//   while (contentNode.firstChild) {
//     parentInstance.insertBefore(contentNode.firstChild, endOfBoundary);
//   }

//   suspenseNode.data = SUSPENSE_START_DATA;
//   if (suspenseNode._reactRetry) {
//     suspenseNode._reactRetry();
//   }
// }
//
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

const completeSegmentFunction =
  'function $RS(b,f){var a=document.getElementById(b),c=document.getElementById(f);for(a.parentNode.removeChild(a);a.firstChild;)c.parentNode.insertBefore(a.firstChild,c);c.parentNode.removeChild(c)}';
const completeBoundaryFunction =
  'function $RC(b,f){var a=document.getElementById(b),c=document.getElementById(f);c.parentNode.removeChild(c);if(a){do a=a.previousSibling;while(8!==a.nodeType||"$?"!==a.data);var h=a.parentNode,d=a.nextSibling,g=0;do{if(d&&8===d.nodeType){var e=d.data;if("/$"===e)if(0===g)break;else g--;else"$"!==e&&"$?"!==e&&"$!"!==e||g++}e=d.nextSibling;h.removeChild(d);d=e}while(d);for(;c.firstChild;)h.insertBefore(c.firstChild,d);a.data="$";a._reactRetry&&a._reactRetry()}}';
const clientRenderFunction =
  'function $RX(b){if(b=document.getElementById(b)){do b=b.previousSibling;while(8!==b.nodeType||"$?"!==b.data);b.data="$!";b._reactRetry&&b._reactRetry()}}';

const completeSegmentScript1Full = stringToPrecomputedChunk(
  '<script>' + completeSegmentFunction + ';$RS("',
);
const completeSegmentScript1Partial = stringToPrecomputedChunk('<script>$RS("');
const completeSegmentScript2 = stringToPrecomputedChunk('","');
const completeSegmentScript3 = stringToPrecomputedChunk('")</script>');

export function writeCompletedSegmentInstruction(
  destination: Destination,
  responseState: ResponseState,
  contentSegmentID: number,
): boolean {
  if (!responseState.sentCompleteSegmentFunction) {
    // The first time we write this, we'll need to include the full implementation.
    responseState.sentCompleteSegmentFunction = true;
    writeChunk(destination, completeSegmentScript1Full);
  } else {
    // Future calls can just reuse the same function.
    writeChunk(destination, completeSegmentScript1Partial);
  }
  writeChunk(destination, responseState.segmentPrefix);
  const formattedID = stringToChunk(contentSegmentID.toString(16));
  writeChunk(destination, formattedID);
  writeChunk(destination, completeSegmentScript2);
  writeChunk(destination, responseState.placeholderPrefix);
  writeChunk(destination, formattedID);
  return writeChunk(destination, completeSegmentScript3);
}

const completeBoundaryScript1Full = stringToPrecomputedChunk(
  '<script>' + completeBoundaryFunction + ';$RC("',
);
const completeBoundaryScript1Partial = stringToPrecomputedChunk(
  '<script>$RC("',
);
const completeBoundaryScript2 = stringToPrecomputedChunk('","');
const completeBoundaryScript3 = stringToPrecomputedChunk('")</script>');

export function writeCompletedBoundaryInstruction(
  destination: Destination,
  responseState: ResponseState,
  boundaryID: SuspenseBoundaryID,
  contentSegmentID: number,
): boolean {
  if (!responseState.sentCompleteBoundaryFunction) {
    // The first time we write this, we'll need to include the full implementation.
    responseState.sentCompleteBoundaryFunction = true;
    writeChunk(destination, completeBoundaryScript1Full);
  } else {
    // Future calls can just reuse the same function.
    writeChunk(destination, completeBoundaryScript1Partial);
  }
  const formattedBoundaryID = boundaryID.formattedID;
  invariant(
    formattedBoundaryID !== null,
    'An ID must have been assigned before we can complete the boundary.',
  );
  const formattedContentID = stringToChunk(contentSegmentID.toString(16));
  writeChunk(destination, formattedBoundaryID);
  writeChunk(destination, completeBoundaryScript2);
  writeChunk(destination, responseState.segmentPrefix);
  writeChunk(destination, formattedContentID);
  return writeChunk(destination, completeBoundaryScript3);
}

const clientRenderScript1Full = stringToPrecomputedChunk(
  '<script>' + clientRenderFunction + ';$RX("',
);
const clientRenderScript1Partial = stringToPrecomputedChunk('<script>$RX("');
const clientRenderScript2 = stringToPrecomputedChunk('")</script>');

export function writeClientRenderBoundaryInstruction(
  destination: Destination,
  responseState: ResponseState,
  boundaryID: SuspenseBoundaryID,
): boolean {
  if (!responseState.sentClientRenderFunction) {
    // The first time we write this, we'll need to include the full implementation.
    responseState.sentClientRenderFunction = true;
    writeChunk(destination, clientRenderScript1Full);
  } else {
    // Future calls can just reuse the same function.
    writeChunk(destination, clientRenderScript1Partial);
  }
  const formattedBoundaryID = boundaryID.formattedID;
  invariant(
    formattedBoundaryID !== null,
    'An ID must have been assigned before we can complete the boundary.',
  );
  writeChunk(destination, formattedBoundaryID);
  return writeChunk(destination, clientRenderScript2);
}
