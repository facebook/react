
## Input

```javascript
// note: comments are for the ideal scopes, not what is currently
// emitted
function foo(props) {
  // scope 0: deps=[props.a] decl=[x] reassign=none
  let x = [];
  x.push(props.a);

  // scope 1: deps=[x] decl=[header] reassign=none
  const header = props.showHeader ? <div>{x}</div> : null;

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
  const $ = React.unstable_useMemoCache(7);
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

  const header = props.showHeader ? <div>{x}</div> : null;
  const c_2 = $[2] !== x;
  const c_3 = $[3] !== props.b;
  const c_4 = $[4] !== props.c;
  let y;
  if (c_2 || c_3 || c_4) {
    y = [x];
    x = [];
    y.push(props.b);
    x.push(props.c);
    $[2] = x;
    $[3] = props.b;
    $[4] = props.c;
    $[5] = y;
    $[6] = x;
  } else {
    y = $[5];
    x = $[6];
  }

  const content = (
    <div>
      {x}
      {y}
    </div>
  );
  return (
    <>
      {header}
      {content}
    </>
  );
}

```
      