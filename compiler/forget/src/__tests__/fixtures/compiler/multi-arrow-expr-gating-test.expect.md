
## Input

```javascript
// @gating
const ErrorView = (error, _retry) => <MessageBox error={error}></MessageBox>;

const Renderer = (props) => (
  <Foo>
    <Bar></Bar>
    <ErrorView></ErrorView>
  </Foo>
);

export default Renderer;

```

## Code

```javascript
import { isForgetEnabled_Fixtures } from "ReactForgetFeatureFlag"; // @gating
function ErrorView_uncompiled(error, _retry) {
  return <MessageBox error={error}></MessageBox>;
}
function ErrorView_forget(error, _retry) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== error;
  let t0;
  if (c_0) {
    t0 = <MessageBox error={error} />;
    $[0] = error;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}
const ErrorView = isForgetEnabled_Fixtures()
  ? ErrorView_forget
  : ErrorView_uncompiled;
function Renderer_uncompiled(props) {
  return (
    <Foo>
      <Bar></Bar>
      <ErrorView></ErrorView>
    </Foo>
  );
}
function Renderer_forget(props) {
  const $ = React.unstable_useMemoCache(3);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <Bar />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = <ErrorView />;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = (
      <Foo>
        {t0}
        {t1}
      </Foo>
    );
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  return t2;
}
const Renderer = isForgetEnabled_Fixtures()
  ? Renderer_forget
  : Renderer_uncompiled;
export default Renderer;

```
      