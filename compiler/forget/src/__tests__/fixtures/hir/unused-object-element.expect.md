
## Input

```javascript
function Foo(props) {
  const { x, y, ...z } = props.a;
  return x;
}

```

## Code

```javascript
function Foo(props) {
  const { x } = props.a;
  return x;
}

```
      