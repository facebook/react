// @validateMemoizedEffectDependencies
import {useLayoutEffect} from 'react';

function Component(props) {
  const data = {};
  useLayoutEffect(() => {
    console.log(props.value);
  }, [data]);
  mutate(data);
  return data;
}
