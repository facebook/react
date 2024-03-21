
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

```


## Error

```
  3 | function TypeAliasUsedAsAnnotation() {
  4 |   type Foo = Bar;
> 5 |   const fun = (f: Foo) => {
    |                   ^^^ [ReactForget] Invariant: [hoisting] Expected value for identifier to be initialized. Foo$0 (5:5)
  6 |     console.log(f);
  7 |   };
  8 |   fun("hello, world");
```
          
      