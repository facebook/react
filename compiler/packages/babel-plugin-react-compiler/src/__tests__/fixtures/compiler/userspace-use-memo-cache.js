// @runtimeModule="react-compiler-runtime"
import {useState} from 'react';

function Component(props) {
  const [x, setX] = useState(1);
  let y;
  if (props.cond) {
    y = x * 2;
  }
  return (
    <button
      onClick={() => {
        setX(10 * y);
      }}>
      Click me
    </button>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [true],
  isComponent: true,
};
