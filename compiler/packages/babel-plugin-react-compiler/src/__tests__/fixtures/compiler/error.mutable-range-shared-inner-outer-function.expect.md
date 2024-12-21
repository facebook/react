
## Input

```javascript
// @enableAssumeHooksFollowRulesOfReact @enableTransitivelyFreezeFunctionExpressions
let cond = true;
function Component(props) {
  let a;
  let b;
  const f = () => {
    if (cond) {
      a = {};
      b = [];
    } else {
      a = {};
      b = [];
    }
    a.property = true;
    b.push(false);
  };
  return <div onClick={f()} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```


## Error

```
   6 |   const f = () => {
   7 |     if (cond) {
>  8 |       a = {};
     |       ^ InvalidReact: Reassigning a variable after render has completed can cause inconsistent behavior on subsequent renders. Consider using state instead. Variable `a` cannot be reassigned after render (8:8)
   9 |       b = [];
  10 |     } else {
  11 |       a = {};
```
          
      