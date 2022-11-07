/**
 * This file is compiled to a standalone browser script by rollup and loaded by Fizz
 *  clients. Therefore, it should be fast and not have many external dependencies.
 * @flow
 */

// Imports are resolved statically by the closure compiler in release bundles
// and by rollup in jest unit tests
import {
  clientRenderBoundary,
  completeBoundaryWithStyles,
  completeBoundary,
  completeSegment,
} from './fizz-instruction-set/ReactDOMFizzInstructionSet';

// Intentionally does nothing. Implementation will be added in future PR.
// eslint-disable-next-line no-unused-vars
const observer = new MutationObserver(mutations => {
  // These are only called so I can check what the module output looks like. The
  // code is unreachable.
  clientRenderBoundary();
  completeBoundaryWithStyles();
  completeBoundary();
  completeSegment();
});
