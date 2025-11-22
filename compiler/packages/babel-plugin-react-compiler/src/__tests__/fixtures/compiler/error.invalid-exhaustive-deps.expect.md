
## Input

```javascript
// @validateExhaustiveMemoizationDependencies
import {useMemo} from 'react';
import {Stringify} from 'shared-runtime';

function Component({x, y, z}) {
  const a = useMemo(() => {
    return x?.y.z?.a;
    // error: too precise
  }, [x?.y.z?.a.b]);
  const b = useMemo(() => {
    return x.y.z?.a;
    // ok, not our job to type check nullability
  }, [x.y.z.a]);
  const c = useMemo(() => {
    return x?.y.z.a?.b;
    // error: too precise
  }, [x?.y.z.a?.b.z]);
  const d = useMemo(() => {
    return x?.y?.[(console.log(y), z?.b)];
    // ok
  }, [x?.y, y, z?.b]);
  const e = useMemo(() => {
    const e = [];
    e.push(x);
    return e;
    // ok
  }, [x]);
  const f = useMemo(() => {
    return [];
    // error: unnecessary
  }, [x, y.z, z?.y?.a, UNUSED_GLOBAL]);
  const ref1 = useRef(null);
  const ref2 = useRef(null);
  const ref = z ? ref1 : ref2;
  const cb = useMemo(() => {
    return () => {
      return ref.current;
    };
    // error: ref is a stable type but reactive
  }, []);
  return <Stringify results={[a, b, c, d, e, f, cb]} />;
}

```


## Error

```
Found 4 errors:

Error: Found missing memoization dependencies

Missing dependencies can cause a value not to update when those inputs change, resulting in stale UI.

error.invalid-exhaustive-deps.ts:7:11
   5 | function Component({x, y, z}) {
   6 |   const a = useMemo(() => {
>  7 |     return x?.y.z?.a;
     |            ^^^^^^^^^ Missing dependency `x?.y.z?.a`
   8 |     // error: too precise
   9 |   }, [x?.y.z?.a.b]);
  10 |   const b = useMemo(() => {

Error: Found missing memoization dependencies

Missing dependencies can cause a value not to update when those inputs change, resulting in stale UI.

error.invalid-exhaustive-deps.ts:15:11
  13 |   }, [x.y.z.a]);
  14 |   const c = useMemo(() => {
> 15 |     return x?.y.z.a?.b;
     |            ^^^^^^^^^^^ Missing dependency `x?.y.z.a?.b`
  16 |     // error: too precise
  17 |   }, [x?.y.z.a?.b.z]);
  18 |   const d = useMemo(() => {

Error: Found unnecessary memoization dependencies

Unnecessary dependencies can cause a value to update more often than necessary, causing performance regressions and effects to fire more often than expected.

error.invalid-exhaustive-deps.ts:31:5
  29 |     return [];
  30 |     // error: unnecessary
> 31 |   }, [x, y.z, z?.y?.a, UNUSED_GLOBAL]);
     |      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Unnecessary dependencies `x`, `y.z`, `z?.y?.a`, `UNUSED_GLOBAL`
  32 |   const ref1 = useRef(null);
  33 |   const ref2 = useRef(null);
  34 |   const ref = z ? ref1 : ref2;

Error: Found missing memoization dependencies

Missing dependencies can cause a value not to update when those inputs change, resulting in stale UI.

error.invalid-exhaustive-deps.ts:37:13
  35 |   const cb = useMemo(() => {
  36 |     return () => {
> 37 |       return ref.current;
     |              ^^^ Missing dependency `ref`. Refs, setState functions, and other "stable" values generally do not need to be added as dependencies, but this variable may change over time to point to different values
  38 |     };
  39 |     // error: ref is a stable type but reactive
  40 |   }, []);
```
          
      