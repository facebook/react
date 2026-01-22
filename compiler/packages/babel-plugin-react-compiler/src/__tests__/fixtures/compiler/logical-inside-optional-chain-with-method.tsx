import {Stringify} from 'shared-runtime';

// Test logical expression as part of optional chain base with method call
function Component(props: {
  a: {x: {getY(): string} | null} | null;
  b: {x: {getY(): string}} | null;
}) {
  'use memo';
  const result = (props.a || props.b)?.x?.getY();
  return <Stringify value={result} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: null, b: {x: {getY: () => 'found'}}}],
  sequentialRenders: [
    {a: null, b: {x: {getY: () => 'found'}}},
    {a: {x: {getY: () => 'first'}}, b: {x: {getY: () => 'second'}}},
    {a: null, b: null},
    {a: {x: null}, b: {x: {getY: () => 'second'}}},
  ],
};
