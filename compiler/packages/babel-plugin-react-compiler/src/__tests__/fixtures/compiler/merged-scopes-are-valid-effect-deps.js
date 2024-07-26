// @validateMemoizedEffectDependencies

import {useEffect} from 'react';

function Component(props) {
  const y = [[props.value]]; // merged w scope for inner array

  useEffect(() => {
    console.log(y);
  }, [y]); // should still be a valid dependency here

  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 42}],
  isComponent: false,
};
