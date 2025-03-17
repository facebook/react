import {createHookWrapper} from 'shared-runtime';

/**
 * Assume that conditionally returned functions can be invoked and that their property
 * loads are hoistable.
 */
function useMakeCallback({
  obj,
  shouldMakeCb,
  setState,
}: {
  obj: {value: number};
  shouldMakeCb: boolean;
  setState: (newState: number) => void;
}) {
  if (shouldMakeCb) return () => setState(obj.value);
  else return null;
}

const setState = (arg: number) => {
  'use no memo';
  return arg;
};
export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useMakeCallback),
  params: [{obj: {value: 1}, shouldMakeCb: true, setState}],
  sequentialRenders: [
    {obj: {value: 1}, shouldMakeCb: true, setState},
    {obj: {value: 2}, shouldMakeCb: true, setState},
  ],
};
