// @inferEffectDependencies
import {useRef, useEffect} from 'react';
import {print, mutate} from 'shared-runtime';

function Component({cond}) {
  const arr = useRef([]);
  const other = useRef([]);
  const derived = cond ? arr : other;
  // Avoid taking derived.current as a dependency
  useEffect(() => {
    mutate(derived.current);
    print(derived.current);
  });
  return arr;
}
