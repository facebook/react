
## Input

```javascript
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

```


## Error

```
  4 |   type Foo = Bar;
  5 |   const fun = (f) => {
> 6 |     let g: Foo = f;
    |            ^^^ [ReactForget] Invariant: [hoisting] Expected value for identifier to be initialized. Foo$0 (6:6)
  7 |     console.log(g);
  8 |   };
  9 |   fun("hello, world");
```
          
      