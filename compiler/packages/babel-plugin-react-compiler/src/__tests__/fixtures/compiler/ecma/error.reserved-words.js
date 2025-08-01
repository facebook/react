import {useRef} from 'react';

function useThing(fn) {
  const fnRef = useRef(fn);
  const ref = useRef(null);

  if (ref.current === null) {
    ref = function(this, ...args) {
      return fn.current.call(this, ...args);
    }
  }
  return ref.current;
}
