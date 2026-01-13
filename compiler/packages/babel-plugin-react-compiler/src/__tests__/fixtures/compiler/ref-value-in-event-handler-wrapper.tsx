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

  // Allowed: we aren't sure that the ref.current value flows into the render
  // output, so we optimistically assume it's safe
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
