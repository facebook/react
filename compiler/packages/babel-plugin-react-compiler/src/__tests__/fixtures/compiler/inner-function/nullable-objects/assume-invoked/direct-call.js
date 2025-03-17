import {useState} from 'react';
import {useIdentity} from 'shared-runtime';

function useMakeCallback({obj}: {obj: {value: number}}) {
  const [state, setState] = useState(0);
  const cb = () => setState(obj.value);
  useIdentity();
  if (state === 0 && obj.value !== 0) {
    cb();
  }
  return cb;
}
export const FIXTURE_ENTRYPOINT = {
  fn: useMakeCallback,
  params: [{obj: {value: 1}}],
  sequentialRenders: [{obj: {value: 1}}, {obj: {value: 2}}],
};
