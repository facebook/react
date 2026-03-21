
## Input

```javascript
import {Stringify} from 'shared-runtime';

/**
 * Bug: TypeScript non-null assertion (!) is transparent to the compiler.
 * `data!.id` inside the closure is lowered as `data.id`, causing the compiler
 * to hoist `data.id` as a cache key that crashes when data is undefined.
 *
 * Related: https://github.com/facebook/react/issues/34194
 */
function Component({data}: {data: {id: string} | undefined}) {
  const handleClick = () => {
    console.log(data!.id);
  };
  if (!data) return null;
  return <Stringify onClick={handleClick}>{data.id}</Stringify>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{data: {id: 'abc'}}],
  sequentialRenders: [{data: {id: 'abc'}}, {data: {id: 'def'}}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

/**
 * Bug: TypeScript non-null assertion (!) is transparent to the compiler.
 * `data!.id` inside the closure is lowered as `data.id`, causing the compiler
 * to hoist `data.id` as a cache key that crashes when data is undefined.
 *
 * Related: https://github.com/facebook/react/issues/34194
 */
function Component(t0) {
  const $ = _c(5);
  const { data } = t0;
  let t1;
  if ($[0] !== data?.id) {
    t1 = () => {
      console.log(data.id);
    };
    $[0] = data?.id;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const handleClick = t1;

  if (!data) {
    return null;
  }
  let t2;
  if ($[2] !== data.id || $[3] !== handleClick) {
    t2 = <Stringify onClick={handleClick}>{data.id}</Stringify>;
    $[2] = data.id;
    $[3] = handleClick;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ data: { id: "abc" } }],
  sequentialRenders: [{ data: { id: "abc" } }, { data: { id: "def" } }],
};

```
      
### Eval output
(kind: ok) <div>{"onClick":"[[ function params=0 ]]","children":"abc"}</div>
<div>{"onClick":"[[ function params=0 ]]","children":"def"}</div>