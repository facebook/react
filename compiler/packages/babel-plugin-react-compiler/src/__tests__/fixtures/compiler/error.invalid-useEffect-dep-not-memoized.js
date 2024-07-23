// @validateMemoizedEffectDependencies
import {useEffect} from 'react';

function Component(props) {
  const data = {};
  useEffect(() => {
    console.log(props.value);
  }, [data]);
  mutate(data);
  return data;
}
