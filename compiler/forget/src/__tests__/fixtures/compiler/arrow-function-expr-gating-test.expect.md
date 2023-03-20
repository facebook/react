
## Input

```javascript
// @gatingModule
const ErrorView = (error, _retry) => <MessageBox error={error}></MessageBox>;

export default ErrorView;

```

## Code

```javascript
import isForgetEnabled from "ReactForgetFeatureFlag"; // @gatingModule
function ErrorView_uncompiled(error, _retry) {
  return <MessageBox error={error}></MessageBox>;
}
function ErrorView_forget(error, _retry) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== error;
  let t0;
  if (c_0) {
    t0 = <MessageBox error={error}></MessageBox>;
    $[0] = error;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}
const ErrorView = isForgetEnabled ? ErrorView_forget : ErrorView_uncompiled;

export default ErrorView;

```
      