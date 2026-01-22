import {Stringify} from 'shared-runtime';

// Test optional chaining inside logical AND (&&) with method calls
function Component(props: {value: {getX(): string} | null; enabled: boolean}) {
  'use memo';
  const value = props.value;
  const result = props.enabled && value?.getX();
  return <Stringify value={result} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: {getX: () => 'hello'}, enabled: true}],
  sequentialRenders: [
    {value: {getX: () => 'hello'}, enabled: true},
    {value: {getX: () => 'hello'}, enabled: false},
    {value: null, enabled: true},
    {value: {getX: () => 'world'}, enabled: true},
  ],
};
