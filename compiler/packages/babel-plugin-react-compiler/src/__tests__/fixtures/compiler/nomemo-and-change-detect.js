// @disableMemoization @enableChangeDetection
import { useMemo } from "react";

function Component(props) {
  const a = useMemo(() => <div>{props.a}</div>, [props]);
  const b = <div>{props.b}</div>;
  return (
    <div>
      {a}
      {b}
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 1, b: 2 }],
  isComponent: true,
};
