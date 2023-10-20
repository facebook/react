
## Input

```javascript
function hoisting(cond) {
  if (cond) {
    const x = 1;
    foo(x);
  }

  const x = 2;
  foo(x);
}

export const FIXTURE_ENTRYPOINT = {
  fn: hoisting,
  params: [false],
  isComponent: false,
};

```


## Error

```
[ReactForget] Invariant: Expected value kind to be initialized at '8:6:8:7' (8:8)
```
          
      