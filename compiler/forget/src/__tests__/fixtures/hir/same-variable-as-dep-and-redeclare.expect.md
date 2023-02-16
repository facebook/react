
## Input

```javascript
// note: comments are for the ideal scopes, not what is currently
// emitted
function foo(props) {
  // scope 0: deps=[props.a] decl=[x] reassign=none
  let x = [];
  x.push(props.a);

  // scope 1: deps=[x] decl=[header] reassign=none
  const header = <div>{x}</div>;

  // scope 2:
  // deps=[x, props.b, props.c]
  // decl=none
  // reassign=[x]
  const y = [x]; // y depends on the earlier x
  x = []; // x reassigned
  y.push(props.b); // interleaved mutation of x/y
  x.push(props.c); // interleaved mutation

  // scope 3 ...
  const content = (
    <div>
      {x}
      {y}
    </div>
  );

  // scope 4 ...
  return (
    <>
      {header}
      {content}
    </>
  );
}

```

## Code

```javascript
// note: comments are for the ideal scopes, not what is currently
// emitted
function foo(props) {
  const $ = React.unstable_useMemoCache(15);
  const c_0 = $[0] !== props.a;
  let x;
  if (c_0) {
    x = [];
    x.push(props.a);
    $[0] = props.a;
    $[1] = x;
  } else {
    x = $[1];
  }
  const c_2 = $[2] !== x;
  let header;
  if (c_2) {
    header = <div>{x}</div>;
    $[2] = x;
    $[3] = header;
  } else {
    header = $[3];
  }
  const c_4 = $[4] !== x;
  const c_5 = $[5] !== props.b;
  const c_6 = $[6] !== props.c;
  let y;
  if (c_4 || c_5 || c_6) {
    y = [x];
    x = [];
    y.push(props.b);
    x.push(props.c);
    $[4] = x;
    $[5] = props.b;
    $[6] = props.c;
    $[7] = y;
    $[8] = x;
  } else {
    y = $[7];
    x = $[8];
  }
  const c_9 = $[9] !== x;
  const c_10 = $[10] !== y;
  let content;
  if (c_9 || c_10) {
    content = (
      <div>
        {x}
        {y}
      </div>
    );
    $[9] = x;
    $[10] = y;
    $[11] = content;
  } else {
    content = $[11];
  }
  const c_12 = $[12] !== header;
  const c_13 = $[13] !== content;
  let t0;
  if (c_12 || c_13) {
    t0 = (
      <>
        {header}
        {content}
      </>
    );
    $[12] = header;
    $[13] = content;
    $[14] = t0;
  } else {
    t0 = $[14];
  }
  return t0;
}

```
      