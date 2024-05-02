
## Input

```javascript
// @enableAssumeHooksFollowRulesOfReact @enableTransitivelyFreezeFunctionExpressions
type Bar = string;
function TypeAliasUsedAsParamAnnotation() {
  type Foo = Bar;
  const fun = (f: Foo) => {
    console.log(f);
  };
  fun("hello, world");
}

export const FIXTURE_ENTRYPOINT = {
  fn: TypeAliasUsedAsParamAnnotation,
  params: [],
};

```

## Code

```javascript
// @enableAssumeHooksFollowRulesOfReact @enableTransitivelyFreezeFunctionExpressions
type Bar = string;
function TypeAliasUsedAsParamAnnotation() {
  const fun = (f) => {
    console.log(f);
  };

  fun("hello, world");
}

export const FIXTURE_ENTRYPOINT = {
  fn: TypeAliasUsedAsParamAnnotation,
  params: [],
};

```
      
### Eval output
(kind: ok) 
logs: ['hello, world']