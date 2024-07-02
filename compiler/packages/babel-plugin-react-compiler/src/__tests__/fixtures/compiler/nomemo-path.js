// @disableMemoizationForDebugging
import { useMemo } from "react";

const w = 42;

function Component(a) {
  let x = useMemo(() => a.x, [a, w]);
  return <div>{x}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 42 }],
  isComponent: true,
};
