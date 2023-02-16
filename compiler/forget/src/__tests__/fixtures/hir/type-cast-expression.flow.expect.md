
## Input

```javascript
// @flow
type Foo = {bar: string};
function Component(props) {
    const x = {bar: props.bar};
    const y = (x: Foo);
    y.bar = 'hello';
    const z = (y: Foo);
    return z;
}
```

## Code

```javascript
// @flow
type Foo = { bar: string };
function Component(props) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== props.bar;
  let y;
  if (c_0) {
    const x = { bar: props.bar };
    y = (x: Foo);
    y.bar = "hello";
    $[0] = props.bar;
    $[1] = y;
  } else {
    y = $[1];
  }

  const z = (y: Foo);
  return z;
}

```
      