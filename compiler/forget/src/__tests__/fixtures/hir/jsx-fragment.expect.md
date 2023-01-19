
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
  const $ = React.useMemoCache();
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <>Text</>;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const c_1 = $[1] !== t0;
  let t2;
  if (c_1) {
    t2 = <div>{t0}</div>;
    $[1] = t0;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const c_3 = $[3] !== props.greeting;
  const c_4 = $[4] !== t2;
  let t5;
  if (c_3 || c_4) {
    t5 = (
      <>
        Hello {props.greeting}
        {t2}
      </>
    );
    $[3] = props.greeting;
    $[4] = t2;
    $[5] = t5;
  } else {
    t5 = $[5];
  }
  return t5;
}

```
      