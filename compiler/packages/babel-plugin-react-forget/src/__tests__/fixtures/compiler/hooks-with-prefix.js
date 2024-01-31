// @hookPattern:"React\$(\w+)"

import * as React from "react";
import { makeArray } from "shared-runtime";

const React$useState = React.useState;
const React$useMemo = React.useMemo;

function Component() {
  const [state, setState] = React$useState(0);
  const doubledArray = React$useMemo(() => {
    return makeArray(state);
  }, [state]);
  return <div>{doubledArray.join("")}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};
