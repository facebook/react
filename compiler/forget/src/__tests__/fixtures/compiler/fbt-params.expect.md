
## Input

```javascript
function Component(props) {
  return (
    <fbt desc={"Dialog to show to user"}>
      Hello <fbt:param name="user name">{props.name}</fbt:param>
    </fbt>
  );
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== props.name;
  let t0;
  if (c_0) {
    t0 = (
      <fbt desc={"Dialog to show to user"}>
        Hello {<fbt:param name={"user name"}>{props.name}</fbt:param>}
      </fbt>
    );
    $[0] = props.name;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      