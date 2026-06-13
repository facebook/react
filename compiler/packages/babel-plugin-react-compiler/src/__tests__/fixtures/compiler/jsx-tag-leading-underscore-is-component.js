import {Stringify} from 'shared-runtime';

function Component({_Tag, value}) {
  return <_Tag value={value} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{_Tag: Stringify, value: 42}],
};
