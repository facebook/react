/* eslint-disable dot-notation */

// Instruction set for the Fizz external runtime

import {
  clientRenderBoundary,
  completeBoundary,
  completeBoundaryWithStyles,
  completeSegment,
  listenToFormSubmissionsForReplaying,
} from './ReactDOMFizzInstructionSetShared';

// This is a string so Closure's advanced compilation mode doesn't mangle it.
// These will be renamed to local references by the external-runtime-plugin.
window['$RM'] = new Map();
window['$RX'] = clientRenderBoundary;
window['$RC'] = completeBoundary;
window['$RR'] = completeBoundaryWithStyles;
window['$RS'] = completeSegment;

listenToFormSubmissionsForReplaying();
