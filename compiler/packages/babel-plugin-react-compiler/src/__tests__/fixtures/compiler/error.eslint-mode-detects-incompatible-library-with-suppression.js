// @noEmit
import {useEffect} from 'react';
import {useKnownIncompatible} from 'ReactCompilerKnownIncompatibleTest';

function MyHook() {
  const data = useKnownIncompatible();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return data;
}

export const FIXTURE_ENTRYPOINT = {
  fn: MyHook,
  params: [],
};
