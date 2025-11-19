// @enableInferEventHandlers
import {useRef} from 'react';

// Simulates a handler wrapper
function handleClick(value: any) {
  return () => {
    console.log(value);
  };
}

function Component() {
  const ref = useRef(null);

  // This should still error: passing ref.current directly to a wrapper
  // The ref value is accessed during render, not in the event handler
  return (
    <>
      <input ref={ref} />
      <button onClick={handleClick(ref.current)}>Click</button>
    </>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};
