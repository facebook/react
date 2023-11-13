
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
[ReactForget] Invariant: [hoisting] Expected value kind to be initialized. read x_0$10 (8:8)
```
          
      