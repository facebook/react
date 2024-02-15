
## Input

```javascript
// @enableEarlyReturnInReactiveScopes:false
function Component(props) {
  let x = [];
  if (props.cond) {
    x.push(props.a);
    // oops no memo!
    return x;
  } else {
    return foo();
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ cond: true, a: 42 }],
};

```


## Error

```
   5 |     x.push(props.a);
   6 |     // oops no memo!
>  7 |     return x;
     |            ^ [ReactForget] Todo: Support early return within a reactive scope (7:7)
   8 |   } else {
   9 |     return foo();
  10 |   }
```
          
      