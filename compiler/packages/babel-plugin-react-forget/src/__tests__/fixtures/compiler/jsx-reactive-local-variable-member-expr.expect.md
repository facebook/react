
## Input

```javascript
import * as sharedRuntime from "shared-runtime";

function Component({
  something,
}: {
  something: { StaticText1: React.ElementType };
}) {
  const Foo = something.StaticText1;
  return () => <Foo />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ something: sharedRuntime }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import * as sharedRuntime from "shared-runtime";

function Component(t13) {
  const $ = useMemoCache(2);
  const { something } = t13;

  const Foo = something.StaticText1;
  let t0;
  if ($[0] !== Foo) {
    t0 = () => <Foo />;
    $[0] = Foo;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ something: sharedRuntime }],
};

```
      
### Eval output
(kind: ok) "[[ function params=0 ]]"