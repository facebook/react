// @validateNoCapitalizedCalls @hookPattern:".*\b(use[^$]+)$"
import * as React from 'react';
const React$useState = React.useState;
const THIS_IS_A_CONSTANT = () => {};
function Component() {
  const b = Boolean(true); // OK
  const n = Number(3); // OK
  const s = String('foo'); // OK
  const [state, setState] = React$useState(0); // OK
  const [state2, setState2] = React.useState(1); // OK
  const constant = THIS_IS_A_CONSTANT(); // OK
  return 3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  isComponent: true,
};
