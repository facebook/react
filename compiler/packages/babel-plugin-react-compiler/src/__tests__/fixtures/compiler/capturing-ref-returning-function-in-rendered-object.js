import {useRef} from 'react';
import {Stringify} from 'shared-runtime';

/**
 * Allowed: we don't have sufficient type information to be sure that
 * this accesses an impure value during render.
 */
function Component(props) {
  const ref = useRef(props.value);
  const object = {};
  object.foo = () => ref.current;
  return <Stringify object={object} shouldInvokeFns={true} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 42}],
};
