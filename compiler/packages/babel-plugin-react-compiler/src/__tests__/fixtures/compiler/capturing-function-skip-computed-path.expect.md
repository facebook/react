
## Input

```javascript
function StoreLandingUnseenGiftModalContainer(a) {
  const giftsSeen = {a};
  return (gift => (gift.id ? giftsSeen[gift.id] : false))();
}

export const FIXTURE_ENTRYPOINT = {
  fn: StoreLandingUnseenGiftModalContainer,
  params: ['TodoAdd'],
  isComponent: 'TodoAdd',
};

```

## Code

```javascript
import _r from "react/compiler-runtime";
const { c: _c } = _r;
function StoreLandingUnseenGiftModalContainer(a) {
  const $ = _c(2);
  let t0;
  if ($[0] !== a) {
    const giftsSeen = { a };
    t0 = ((gift) => (gift.id ? giftsSeen[gift.id] : false))();
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: StoreLandingUnseenGiftModalContainer,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      