import {useState} from 'react'; // @enableChangeDetectionForDebugging

function useOther(x) {
  return x;
}

function Component(props) {
  const w = f(props.x);
  const z = useOther(w);
  const [x, _] = useState(z);
  return <div>{x}</div>;
}

function f(x) {
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{x: 42}],
  isComponent: true,
};
