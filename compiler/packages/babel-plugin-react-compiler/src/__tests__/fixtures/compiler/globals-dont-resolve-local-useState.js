import { useState as _useState } from "react";

function useState(value) {
  return _useState(value);
}

function Component() {
  const [state, setState] = useState("hello");

  return <div onClick={() => setState("bye")}>{state}</div>;
}
