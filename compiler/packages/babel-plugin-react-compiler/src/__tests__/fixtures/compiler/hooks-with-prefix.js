// @hookPattern:".*\b(use[^$]+)$"

import * as React from 'react';
import {makeArray, useHook} from 'shared-runtime';

const React$useState = React.useState;
const React$useMemo = React.useMemo;
const Internal$Reassigned$useHook = useHook;

function Component() {
  const [state, setState] = React$useState(0);
  const object = Internal$Reassigned$useHook();
  const json = JSON.stringify(object);
  const doubledArray = React$useMemo(() => {
    return makeArray(state);
  }, [state]);
  return (
    <div>
      {doubledArray.join('')}
      {json}
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};
