
## Input

```javascript
function Component(props) {
  return (
    <fbt desc={"Dialog to show to user"}>
      Hello <fbt:param name="user name">{capitalize(props.name)}</fbt:param>
    </fbt>
  );
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache(4);
  const c_0 = $[0] !== props.name;
  let t1;
  if (c_0) {
    const c_2 = $[2] !== props.name;
    let t0;
    if (c_2) {
      t0 = capitalize(props.name);
      $[2] = props.name;
      $[3] = t0;
    } else {
      t0 = $[3];
    }
    t1 = (
      <fbt desc={"Dialog to show to user"}>
        Hello {<fbt:param name={"user name"}>{t0}</fbt:param>}
      </fbt>
    );
    $[0] = props.name;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

```
      