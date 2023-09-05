
## Input

```javascript
function hoisting() {
  const foo = () => {
    return bar + baz;
  };
  let bar = 3;
  const baz = 2;
  return foo(); // OK: called outside of TDZ for bar/baz
}

export const FIXTURE_ENTRYPOINT = {
  fn: hoisting,
  params: [],
  isComponent: false,
};

```


## Error

```
[ReactForget] Invariant: EnterSSA: Expected identifier to be defined before being used. Identifier bar$0 is undefined (5:5)
```
          
      