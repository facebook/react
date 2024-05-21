import { useState as _useState, useCallback, useEffect } from "react";
import { ValidateMemoization } from "shared-runtime";

function useState(value) {
  "use no memo"; // opt-out because we want to force resetting the setState function
  const [state, _setState] = _useState(value);
  const setState = useCallback(
    (...args) => {
      console.log(...args);
      return _setState(...args);
    },
    // explicitly reset the callback when state changes
    [state]
  );
  if (setState.state === undefined) {
    setState.state = state;
  }
  return [state, setState];
}

function Component() {
  const [state, setState] = useState("hello");
  console.log(state, setState.state);

  const callback = useCallback(() => {
    setState("goodbye");
  }, [setState]);

  useEffect(() => {
    callback();
  }, []);

  return (
    <>
      <ValidateMemoization inputs={[setState]} output={callback} />
      {state}
    </>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};
