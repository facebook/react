import invariant from "invariant";
import { useState } from "react";

function Component(props) {
  const [x, setX] = useState(false);
  const [y, setY] = useState(false);
  let setState;
  if (props.cond) {
    setState = setX;
  } else {
    setState = setY;
  }
  const setState2 = setState;
  const stateObject = { setState: setState2 };
  return (
    <Foo
      cond={props.cond}
      setX={setX}
      setY={setY}
      setState={stateObject.setState}
    />
  );
}

function Foo({ cond, setX, setY, setState }) {
  if (cond) {
    invariant(setState === setX, "Expected the correct setState function");
  } else {
    invariant(setState === setY, "Expected the correct setState function");
  }
  return "ok";
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  // TODO: run this function with {cond:true}, {cond: false}
  params: [{ cond: true }],
};
