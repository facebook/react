import {identity} from 'shared-runtime';

function Symbol() {
  return <div>I am a component named Symbol</div>;
}

function Component({value}) {
  const x = identity(value);
  return <Symbol>{x}</Symbol>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 'hello'}],
};
