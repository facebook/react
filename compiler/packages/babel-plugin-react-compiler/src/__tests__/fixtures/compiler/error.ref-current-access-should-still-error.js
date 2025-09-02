// @validateRefAccessDuringRender @compilationMode:"infer"
// This SHOULD trigger a ref validation error because we're accessing useRef().current
import {useRef} from 'react';

function Component(props) {
  const ref = useRef(null);
  const refValue = ref.current; // This should error
  const otherValue = props.value; // This should be fine
  return <div>{refValue} {otherValue}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 'other-prop'}],
  isComponent: true,
};
