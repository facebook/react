// Test that optional chaining is still removed when appropriate.
// When a nested function is unconditionally called (e.g., as a JSX prop handler),
// and the variable is accessed non-optionally, we should still optimize away the ?. 

import {useState} from 'react';

function Component({device}) {
  const [count, setCount] = useState(0);
  
  // This handler is unconditionally passed to onClick
  const handleClick = () => {
    console.log(device.type);  // this is safe to access directly
    console.log(device.id);
  };
  
  return (
    <div>
      <button onClick={handleClick}>Click {count}</button>
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{device: {type: 'phone', id: 123}}],
  isComponent: true,
};
