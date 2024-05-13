
## Input

```javascript
// @gating
const ErrorView = (error, _retry) => <MessageBox error={error}></MessageBox>;

export default Renderer = (props) => (
  <Foo>
    <Bar></Bar>
    <ErrorView></ErrorView>
  </Foo>
);

```

## Code

```javascript
import { isForgetEnabled_Fixtures } from "ReactForgetFeatureFlag";
import { c as _c } from "react/compiler-runtime"; // @gating
const ErrorView = isForgetEnabled_Fixtures()
  ? (error, _retry) => {
      const $ = _c(2);
      let t0;
      if ($[0] !== error) {
        t0 = <MessageBox error={error} />;
        $[0] = error;
        $[1] = t0;
      } else {
        t0 = $[1];
      }
      return t0;
    }
  : (error, _retry) => <MessageBox error={error}></MessageBox>;

export default Renderer = isForgetEnabled_Fixtures()
  ? (props) => {
      const $ = _c(2);
      let t0;
      if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = <Bar />;
        $[0] = t0;
      } else {
        t0 = $[0];
      }
      let t1;
      if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = (
          <Foo>
            {t0}
            <ErrorView />
          </Foo>
        );
        $[1] = t1;
      } else {
        t1 = $[1];
      }
      return t1;
    }
  : (props) => (
      <Foo>
        <Bar></Bar>
        <ErrorView></ErrorView>
      </Foo>
    );

```
      