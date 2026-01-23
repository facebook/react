import {Stringify} from 'shared-runtime';

// Test ternary expression producing the value used in optional chaining with method call
function Component(props: {
  a: {getX(): string} | null;
  b: {getX(): string} | null;
  cond: boolean;
}) {
  'use memo';
  const obj = props.cond ? props.a : props.b;
  const result = obj?.getX();
  return <Stringify value={result} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: {getX: () => 'a'}, b: {getX: () => 'b'}, cond: true}],
  sequentialRenders: [
    {a: {getX: () => 'a'}, b: {getX: () => 'b'}, cond: true},
    {a: {getX: () => 'a'}, b: {getX: () => 'b'}, cond: false},
    {a: null, b: {getX: () => 'b'}, cond: true},
    {a: {getX: () => 'a'}, b: null, cond: false},
  ],
};
