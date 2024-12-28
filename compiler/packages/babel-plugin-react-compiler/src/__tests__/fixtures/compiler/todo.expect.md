
## Input

```javascript
function Component() {
  let myObj = getObject();
  useFoo();
  // const cb = () => maybeMutate(myObj ?? []);
  const cb = () => (myObj = other());
  foo(cb);

  return myObj;
}

```

## Code

```javascript
function Component() {
  let myObj;
  myObj = getObject();
  useFoo();

  const cb = () => (myObj = other());
  foo(cb);
  return myObj;
}

```
      
### Eval output
(kind: exception) Fixture not implemented