// @enableInstructionReordering
import {useState} from 'react';

function Component() {
  const [state, setState] = useState(0);
  const onClick = () => {
    setState(s => s + 1);
  };
  return (
    <>
      <span>Count: {state}</span>
      <button onClick={onClick}>Increment</button>
    </>
  );
}
