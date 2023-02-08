
## Input

```javascript
function componentA(props) {
  let t = `hello ${props.a}, ${props.b}!`;
  t += ``;
  return t;
}

function componentB(props) {
  let x = useFoo(`hello ${props.a}`);
  return x;
}

```

## Code

```javascript
function componentA(props) {
  const t = `hello ${props.a}, ${props.b}!`;
  const t$0 = t + ``;
  return t$0;
}

function componentB(props) {
  const x = useFoo(`hello ${props.a}`);
  return x;
}

```
      