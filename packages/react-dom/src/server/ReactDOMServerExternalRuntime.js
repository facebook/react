// TODO: Add Flow types
import {
  clientRenderBoundary,
  completeBoundaryWithStyles,
  completeBoundary,
  completeSegment,
} from 'react-dom-bindings/src/server/fizz-instruction-set/ReactDOMFizzInstructionSet';

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
