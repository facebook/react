
## Input

```javascript
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
[ReactForget] Todo: Support early return within a reactive scope (6:6)
```
          
      