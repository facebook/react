// @flow
import { identity } from "shared-runtime";

function Component(props: { id: number }) {
  const x = ([props.id]: Array<number>);
  const y = identity(x[0]);
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ id: 42 }],
};
