// @compilationMode:"annotation" @enableEmitTraceTape

function Foo(props) {
  'use memo';
  'use trace tape';
  return <div title={props.title}>{props.count}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{title: 'hello', count: 3}],
};