// @validateMemoizedEffectDependencies
import {useInsertionEffect} from 'react';

function Component(props) {
  const data = {};
  useInsertionEffect(() => {
    console.log(props.value);
  }, [data]);
  mutate(data);
  return data;
}
