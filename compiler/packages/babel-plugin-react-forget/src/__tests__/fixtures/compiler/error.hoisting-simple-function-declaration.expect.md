
## Input

```javascript
function hoisting() {
  function bar() {
    return x;
  }
  return baz(); // OK: FuncDecls are HoistableDeclarations that have both declaration and value hoisting
  function baz() {
    return bar();
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: hoisting,
  params: [],
  isComponent: false,
};

```


## Error

```
[ReactForget] Invariant: [hoisting] Expected value for identifier to be initialized. baz$5 (5:5)
```
          
      