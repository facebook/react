
## Input

```javascript
function Foo(props) {
  return (
    <>
      Hello {props.greeting}{" "}
      <div>
        <>Text</>
      </div>
    </>
  );
}

```

## Code

```javascript
function Foo(props) {
  const $ = React.unstable_useMemoCache(4);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <>Text</>;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = <div>{t0}</div>;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const c_2 = $[2] !== props.greeting;
  let t2;
  if (c_2) {
    t2 = (
      <>
        Hello {props.greeting}
        {t1}
      </>
    );
    $[2] = props.greeting;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}

```
      