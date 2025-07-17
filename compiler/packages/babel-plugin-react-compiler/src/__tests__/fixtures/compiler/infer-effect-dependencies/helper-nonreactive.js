// @inferEffectDependencies
import {useEffect, useRef, AUTODEPS} from 'react';
function useCustomRef() {
  const ref = useRef();
  return ref;
}
function NonReactiveWrapper() {
  const ref = useCustomRef();
  useEffect(() => {
    print(ref);
  }, AUTODEPS);
}
