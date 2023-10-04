
## Input

```javascript
import { RenderPropAsChild, StaticText1, StaticText2 } from "shared-runtime";

function Component(props: { showText1: boolean }) {
  const Foo = props.showText1 ? StaticText1 : StaticText2;

  return <RenderPropAsChild items={[() => <Foo key="0" />]} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ showText1: false }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { RenderPropAsChild, StaticText1, StaticText2 } from "shared-runtime";

function Component(props) {
  const $ = useMemoCache(6);
  const Foo = props.showText1 ? StaticText1 : StaticText2;
  const c_0 = $[0] !== Foo;
  let t0;
  if (c_0) {
    t0 = () => <Foo key="0" />;
    $[0] = Foo;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const c_2 = $[2] !== t0;
  let t1;
  if (c_2) {
    t1 = [t0];
    $[2] = t0;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const c_4 = $[4] !== t1;
  let t2;
  if (c_4) {
    t2 = <RenderPropAsChild items={t1} />;
    $[4] = t1;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ showText1: false }],
};

```
      