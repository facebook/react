// @inferEffectDependencies
import {useEffect, useState} from 'react';
import {print} from 'shared-runtime';

/*
 * setState types are not enough to determine to omit from deps. Must also take reactivity into account.
 */
function ReactiveRefInEffect(props) {
  const [_state1, setState1] = useRef('initial value');
  const [_state2, setState2] = useRef('initial value');
  let setState;
  if (props.foo) {
    setState = setState1;
  } else {
    setState = setState2;
  }
  useEffect(() => print(setState));
}
