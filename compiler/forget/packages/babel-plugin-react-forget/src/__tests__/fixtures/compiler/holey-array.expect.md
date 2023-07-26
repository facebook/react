
## Input

```javascript
function t(props) {
  let [, setstate] = useState();
  setstate(1);
  return props.foo;
}

```

## Code

```javascript
function t(props) {
  const [, setstate] = useState();
  setstate(1);
  return props.foo;
}

```
      