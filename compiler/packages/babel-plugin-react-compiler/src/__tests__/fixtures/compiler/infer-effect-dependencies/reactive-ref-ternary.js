// @inferEffectDependencies
import {useRef, useEffect} from 'react';
import {print, mutate} from 'shared-runtime';

function Component({cond}) {
  const arr = useRef([]);
  const other = useRef([]);
  // Although arr and other are both stable, derived is not
  const derived = cond ? arr : other;
  useEffect(() => {
    mutate(derived.current);
    print(derived.current);
  });
  return arr;
}
