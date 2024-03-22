import { useMemo } from "react";
import { Stringify } from "shared-runtime";

function Component({}) {
  let a = "a";
  let b = "";
  [a, b] = [null, null];
  return <Stringify a={a} b={b} onClick={() => a} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};
