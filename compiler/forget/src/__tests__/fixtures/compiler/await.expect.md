
## Input

```javascript
async function Component(props) {
  const user = await load(props.id);
  return <div>{user.name}</div>;
}

```

## Code

```javascript
async function Component(props) {
  const $ = React.unstable_useMemoCache(4);
  const c_0 = $[0] !== props.id;
  let t0;
  if (c_0) {
    t0 = await load(props.id);
    $[0] = props.id;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const user = t0;
  const c_2 = $[2] !== user.name;
  let t1;
  if (c_2) {
    t1 = <div>{user.name}</div>;
    $[2] = user.name;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

```
      