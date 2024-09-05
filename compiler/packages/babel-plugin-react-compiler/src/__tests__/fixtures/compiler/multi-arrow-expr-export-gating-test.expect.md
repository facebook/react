
## Input

```javascript
// @gating
const ErrorView = (error, _retry) => <MessageBox error={error}></MessageBox>;

export const Renderer = props => (
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

export const Renderer = isForgetEnabled_Fixtures()
  ? (props) => {
      const $ = _c(1);
      let t0;
      if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = (
          <Foo>
            <Bar />
            <ErrorView />
          </Foo>
        );
        $[0] = t0;
      } else {
        t0 = $[0];
      }
      return t0;
    }
  : (props) => (
      <Foo>
        <Bar></Bar>
        <ErrorView></ErrorView>
      </Foo>
    );

```
      