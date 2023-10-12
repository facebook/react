
## Input

```javascript
// Some reactive scopes are created within a conditional. If a child scope
// is within a conditional, its reactive dependencies should be propagated
// as conditionals
//
// In this test:
// ```javascript
// scope @0 (deps=[???] decls=[x]) {
//   const x = {};
//   if (foo) {
//     scope @1 (deps=[props.a.b] decls=[tmp]) {
//       const tmp = bar(props.a.b);
//     }
//     x.a = tmp;
//   }
// }
// return x;
// ```

function TestReactiveDepsInCondScope(props) {
  let x = {};
  if (foo) {
    let tmp = bar(props.a.b);
    x.a = tmp;
  }
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // Some reactive scopes are created within a conditional. If a child scope
// is within a conditional, its reactive dependencies should be propagated
// as conditionals
//
// In this test:
// ```javascript
// scope @0 (deps=[???] decls=[x]) {
//   const x = {};
//   if (foo) {
//     scope @1 (deps=[props.a.b] decls=[tmp]) {
//       const tmp = bar(props.a.b);
//     }
//     x.a = tmp;
//   }
// }
// return x;
// ```

function TestReactiveDepsInCondScope(props) {
  const $ = useMemoCache(4);
  let x;
  if ($[0] !== props) {
    x = {};
    if (foo) {
      let t0;
      if ($[2] !== props.a.b) {
        t0 = bar(props.a.b);
        $[2] = props.a.b;
        $[3] = t0;
      } else {
        t0 = $[3];
      }
      const tmp = t0;
      x.a = tmp;
    }
    $[0] = props;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      