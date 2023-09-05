
## Input

```javascript
function hoisting() {
  const foo = () => {
    return bar();
  };
  const bar = () => {
    return 1;
  };

  return foo(); // OK: bar's value is only accessed outside of its TDZ
}

export const FIXTURE_ENTRYPOINT = {
  fn: hoisting,
  params: [],
  isComponent: false,
};

```


## Error

```
[ReactForget] Invariant: EnterSSA: Expected identifier to be defined before being used. Identifier bar$0 is undefined (5:7)
```
          
      