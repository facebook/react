// @flow @compilationMode(infer)
export default component Foo(bar: number) {
  return <Bar bar={bar} />;
}

function shouldNotCompile() {}
