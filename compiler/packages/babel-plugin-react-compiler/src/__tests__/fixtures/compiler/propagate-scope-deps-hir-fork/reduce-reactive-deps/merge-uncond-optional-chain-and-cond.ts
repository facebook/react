// @enablePropagateDepsInHIR
import {identity} from 'shared-runtime';

/**
 * Very contrived text fixture showing that it's technically incorrect to merge
 * a conditional dependency (e.g. dep.path in `cond ? dep.path : ...`) and an
 * unconditionally evaluated optional chain (`dep?.path`).
 *
 *
 * when screen is non-null, useFoo returns { title: null } or "(not null)"
 * when screen is null, useFoo throws
 */
function useFoo({screen}: {screen: null | undefined | {title_text: null}}) {
  return screen?.title_text != null
    ? '(not null)'
    : identity({title: screen.title_text});
}
export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{screen: null}],
  sequentialRenders: [{screen: {title_bar: undefined}}, {screen: null}],
};
