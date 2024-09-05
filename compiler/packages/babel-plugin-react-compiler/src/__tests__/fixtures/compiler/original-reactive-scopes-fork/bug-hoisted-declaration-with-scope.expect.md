
## Input

```javascript
// @enableReactiveScopesInHIR:false
import {StaticText1, Stringify, identity, useHook} from 'shared-runtime';
/**
 * `button` and `dispatcher` must end up in the same memo block. It would be
 * invalid for `button` to take a dependency on `dispatcher` as dispatcher
 * is created later.
 *
 * Sprout error:
 * Found differences in evaluator results
 * Non-forget (expected):
 * (kind: ok) "[[ function params=1 ]]"
 * Forget:
 * (kind: exception) Cannot access 'dispatcher' before initialization
 */
function useFoo({onClose}) {
  const button = StaticText1 ?? (
    <Stringify
      primary={{
        label: identity('label'),
        onPress: onClose,
      }}
      secondary={{
        onPress: () => {
          dispatcher.go('route2');
        },
      }}
    />
  );

  const dispatcher = useHook();

  return button;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{onClose: identity()}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableReactiveScopesInHIR:false
import { StaticText1, Stringify, identity, useHook } from "shared-runtime";
/**
 * `button` and `dispatcher` must end up in the same memo block. It would be
 * invalid for `button` to take a dependency on `dispatcher` as dispatcher
 * is created later.
 *
 * Sprout error:
 * Found differences in evaluator results
 * Non-forget (expected):
 * (kind: ok) "[[ function params=1 ]]"
 * Forget:
 * (kind: exception) Cannot access 'dispatcher' before initialization
 */
function useFoo(t0) {
  const $ = _c(3);
  const { onClose } = t0;
  let t1;
  if ($[0] !== onClose || $[1] !== dispatcher) {
    t1 = StaticText1 ?? (
      <Stringify
        primary={{ label: identity("label"), onPress: onClose }}
        secondary={{
          onPress: () => {
            dispatcher.go("route2");
          },
        }}
      />
    );
    $[0] = onClose;
    $[1] = dispatcher;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const button = t1;

  const dispatcher = useHook();
  return button;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ onClose: identity() }],
};

```
      