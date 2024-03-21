// @flow @enableAssumeHooksFollowRulesOfReact @enableTransitivelyFreezeFunctionExpressions
type Bar = string;
function TypeAliasUsedAsAnnotation() {
  type Foo = Bar;
  const fun = (f: Foo) => {
    console.log(f);
  };
  fun("hello, world");
}
