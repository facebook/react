
## Input

```javascript
// @flow @enableAssumeHooksFollowRulesOfReact @enableTransitivelyFreezeFunctionExpressions
type Bar = string;
function TypeAliasUsedAsAnnotation() {
  type Foo = Bar;
  const fun = (f: Foo) => {
    console.log(f);
  };
  fun("hello, world");
}

export const FIXTURE_ENTRYPOINT = {
  fn: TypeAliasUsedAsAnnotation,
  params: [],
};
```

## Code

```javascript
type Bar = string;
function TypeAliasUsedAsAnnotation() {
  const fun = (f) => {
    console.log(f);
  };

  fun("hello, world");
}

export const FIXTURE_ENTRYPOINT = {
  fn: TypeAliasUsedAsAnnotation,
  params: [],
};

```
      
### Eval output
(kind: ok) 
logs: ['hello, world']