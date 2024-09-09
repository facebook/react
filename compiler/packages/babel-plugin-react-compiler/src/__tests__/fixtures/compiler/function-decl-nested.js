import {useRef} from 'react';

function C(x) {
  function g(x) {
    return 2;
  }
  g();
  function f() {
    return x.x;
  }
  function h(x) {
    return 2;
  }
  return <>{h(f)}</>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: C,
  params: [{x: 1}],
};
