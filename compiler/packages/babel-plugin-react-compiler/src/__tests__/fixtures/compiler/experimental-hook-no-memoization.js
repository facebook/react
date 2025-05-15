// @flow

import {experimental_useEffectEvent, useEffect} from 'react';

component Component(prop: number) {
  const x = experimental_useEffectEvent(() => {
    console.log(prop);
  });
  useEffect(() => x());
  return prop;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{prop: 1}],
};
