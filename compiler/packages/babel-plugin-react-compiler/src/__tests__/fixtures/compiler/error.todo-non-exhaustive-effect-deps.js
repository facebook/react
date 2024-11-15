import {logValue} from 'shared-runtime';

function Component({a}) {
  useEffect(() => {
    logValue(a);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: 0}],
  sequentialRenders: [{a: 1}],
};
