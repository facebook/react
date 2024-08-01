import {useEffect, useMemo} from 'react';

function Component(props) {
  function foo() {
    mutate();
  }
  const h = [foo];
  useEffect(() => { a(h) });
  return lengh();
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{test: true, value: 'hello'}],
};
