// @enablePreserveExistingMemoizationGuarantees
import { useMemo } from "react";
import {
  identity,
  makeObject_Primitives,
  mutate,
  useHook,
} from "shared-runtime";

function Component(props) {
  const free = makeObject_Primitives();
  const free2 = makeObject_Primitives();
  const part = free2.part;
  useHook();
  const object = useMemo(() => {
    const x = makeObject_Primitives();
    x.value = props.value;
    mutate(x, free, part);
    return x;
  }, [props.value]);
  return object;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
};
