
## Input

```javascript
function Foo(props) {
  let x = bar(props.a);
  let y = x?.b;

  let z = useBar(y);
  return z;
}

```

## Code

```javascript
function Foo(props) {
  const x = bar(props.a);
  const y = x?.b;

  const z = useBar(y);
  return z;
}

```
      