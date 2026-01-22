import {Stringify} from 'shared-runtime';

// Test optional chaining inside logical OR (||) with method calls
function Component(props: {value: {getX(): string} | null; fallback: string}) {
  'use memo';
  const value = props.value;
  const result = value?.getX() || props.fallback;
  return <Stringify value={result} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: null, fallback: 'default'}],
  sequentialRenders: [
    {value: null, fallback: 'default'},
    {value: {getX: () => 'hello'}, fallback: 'default'},
    {value: {getX: () => ''}, fallback: 'default'},
    {value: null, fallback: 'other'},
  ],
};
