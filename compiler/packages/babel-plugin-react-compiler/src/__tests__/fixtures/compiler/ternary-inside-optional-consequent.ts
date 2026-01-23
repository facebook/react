// Test ternary expression producing the value used in optional chaining
function Component(props: {
  a: {x: string} | null;
  b: {x: string} | null;
  cond: boolean;
}) {
  'use memo';
  const obj = props.cond ? props.a : props.b;
  return obj?.x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: {x: 'a'}, b: {x: 'b'}, cond: true}],
  sequentialRenders: [
    {a: {x: 'a'}, b: {x: 'b'}, cond: true}, // picks a -> 'a'
    {a: {x: 'a'}, b: {x: 'b'}, cond: false}, // picks b -> 'b'
    {a: null, b: {x: 'b'}, cond: true}, // picks a (null) -> undefined
    {a: {x: 'a'}, b: null, cond: false}, // picks b (null) -> undefined
  ],
};
