// @enableFlowSuppressions

function Foo(props) {
  // $FlowFixMe[incompatible-type]
  useX();
  const x = new Foo(...props.foo, null, ...[props.bar]);
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [
    {
      foo: [1],
      bar: 2,
    },
  ],
};
