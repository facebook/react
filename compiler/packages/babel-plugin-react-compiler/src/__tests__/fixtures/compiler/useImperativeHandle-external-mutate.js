// @flow

import {useImperativeHandle, useRef} from 'react';

const a = {b: 42};
let b = 42;

component Component(prop: number) {
  const ref = useRef(null);
  useImperativeHandle(ref, () => {
    a.b = prop;
    b = prop;
    return {
      foo: () => {
        a.b = prop;
        b = prop;
      },
    };
  }, [prop]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{prop: 1}],
};
