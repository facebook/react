import { useEffect, useState } from "react";

let someGlobal = false;

function Component() {
  const [state, setState] = useState(someGlobal);

  const setGlobal = () => {
    // TODO: this should be allowed since setGlobal is only used in an effect
    someGlobal = true;
  };
  useEffect(() => {
    setGlobal();
  }, []);

  useEffect(() => {
    setState(someGlobal);
  }, [someGlobal]);

  return <div>{String(state)}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};
