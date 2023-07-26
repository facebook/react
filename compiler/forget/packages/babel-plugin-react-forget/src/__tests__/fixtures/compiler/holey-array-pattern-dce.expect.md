
## Input

```javascript
function t(props) {
  let [, foo, bar] = props;
  return foo;
}

```

## Code

```javascript
function t(props) {
  const [, foo] = props;
  return foo;
}

```
      