// @flow @enableAssumeHooksFollowRulesOfReact @enableTransitivelyFreezeFunctionExpressions
type Bar = string;
function TypeAliasUsedAsAnnotation() {
  type Foo = Bar;
  const fun = (f) => {
    let g: Foo = f;
    console.log(g);
  };
  fun("hello, world");
}
