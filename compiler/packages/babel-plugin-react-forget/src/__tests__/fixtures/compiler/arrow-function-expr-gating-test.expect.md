
## Input

```javascript
// @gating
const ErrorView = (error, _retry) => <MessageBox error={error}></MessageBox>;

export default ErrorView;

```

## Code

```javascript
import { isForgetEnabled_Fixtures } from "ReactForgetFeatureFlag";
import { unstable_useMemoCache as useMemoCache } from "react"; // @gating
const ErrorView = isForgetEnabled_Fixtures()
  ? (error, _retry) => {
      const $ = useMemoCache(2);
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
  : (error, _retry) => <MessageBox error={error}></MessageBox>;

export default ErrorView;

```
      