import {useRef} from 'react';

/**
 * Allowed: we don't have sufficient type information to be sure that
 * this accesses an impure value during render.
 */
function Component() {
  const ref = useRef(null);
  const object = {};
  object.foo = () => ref.current;
  const refValue = object.foo();
  return <div>{refValue}</div>;
}
