import {useMemo} from 'react';

function useIdentity(value, identityFn) {
  const identity = identityFn(value);
  return useMemo(() => value, [identity]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useIdentity,
  params: [1, x => x],
}; 