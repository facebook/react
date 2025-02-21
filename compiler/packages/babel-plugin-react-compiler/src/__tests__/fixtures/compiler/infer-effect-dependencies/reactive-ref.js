// @inferEffectDependencies
import {useEffect, useRef} from 'react';
import {print} from 'shared-runtime';

/*
 * Ref types are not enough to determine to omit from deps. Must also take reactivity into account.
 */
function ReactiveRefInEffect(props) {
  const ref1 = useRef('initial value');
  const ref2 = useRef('initial value');
  let ref;
  if (props.foo) {
    ref = ref1;
  } else {
    ref = ref2;
  }
  useEffect(() => print(ref));
}
