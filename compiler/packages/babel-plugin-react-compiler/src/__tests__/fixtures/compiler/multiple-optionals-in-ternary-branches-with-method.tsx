import {Stringify} from 'shared-runtime';

// Test optional chaining with method calls in both branches of a ternary
function Component(props: {
  a: {getX(): string} | null;
  b: {getY(): string} | null;
  cond: boolean;
}) {
  'use memo';
  const result = props.cond ? props.a?.getX() : props.b?.getY();
  return <Stringify value={result} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: {getX: () => 'hello'}, b: {getY: () => 'world'}, cond: true}],
  sequentialRenders: [
    {a: {getX: () => 'hello'}, b: {getY: () => 'world'}, cond: true},
    {a: {getX: () => 'hello'}, b: {getY: () => 'world'}, cond: false},
    {a: null, b: {getY: () => 'world'}, cond: true},
    {a: {getX: () => 'hello'}, b: null, cond: false},
  ],
};
