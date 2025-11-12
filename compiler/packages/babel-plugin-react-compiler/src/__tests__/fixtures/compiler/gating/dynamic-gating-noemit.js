// @dynamicGating:{"source":"shared-runtime"} @outputMode:"none"

function Foo() {
  'use memo if(getTrue)';
  return <div>hello world</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}],
};
