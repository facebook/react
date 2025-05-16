// @flow

import {experimental_useEffectEvent, useRef} from 'react';

component Component(prop: number) {
  const ref1 = useRef(null);
  const ref2 = useRef(1);
  experimental_useEffectEvent(ref1, () => {
    const precomputed = prop + ref2.current;
    return {
      foo: () => prop + ref2.current + precomputed,
    };
  }, [prop]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{prop: 1}],
};
