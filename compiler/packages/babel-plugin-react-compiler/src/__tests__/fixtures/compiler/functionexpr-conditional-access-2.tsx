// @enableTreatFunctionDepsAsConditional
import {Stringify} from 'shared-runtime';

function Component({props}) {
  const f = () => props.a.b;

  return <Stringify f={props == null ? () => {} : f} />;
}
export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{props: null}],
};
