
## Input

```javascript
// @validateExhaustiveMemoizationDependencies
import {useMemo} from 'react';
import {Stringify} from 'shared-runtime';

function Component({x, y, z}) {
  const a = useMemo(() => {
    return x?.y.z?.a;
  }, [x?.y.z?.a.b]);
  const b = useMemo(() => {
    return x.y.z?.a;
  }, [x.y.z.a]);
  const c = useMemo(() => {
    return x?.y.z.a?.b;
  }, [x?.y.z.a?.b.z]);
  const d = useMemo(() => {
    return x?.y?.[(console.log(y), z?.b)];
  }, [x?.y, y, z?.b]);
  const e = useMemo(() => {
    const e = [];
    e.push(x);
    return e;
  }, [x]);
  const f = useMemo(() => {
    return [];
  }, [x, y.z, z?.y?.a, UNUSED_GLOBAL]);
  const ref1 = useRef(null);
  const ref2 = useRef(null);
  const ref = z ? ref1 : ref2;
  const cb = useMemo(() => {
    return () => {
      return ref.current;
    };
  }, []);
  return <Stringify results={[a, b, c, d, e, f, cb]} />;
}

```


## Error

```
Found 5 errors:

Error: Found non-exhaustive dependencies

Missing dependencies can cause a value not to update when those inputs change, resulting in stale UI.

error.invalid-exhaustive-deps.ts:7:11
   5 | function Component({x, y, z}) {
   6 |   const a = useMemo(() => {
>  7 |     return x?.y.z?.a;
     |            ^^^^^^^^^ Missing dependency `x?.y.z?.a`
   8 |   }, [x?.y.z?.a.b]);
   9 |   const b = useMemo(() => {
  10 |     return x.y.z?.a;

Error: Found non-exhaustive dependencies

Missing dependencies can cause a value not to update when those inputs change, resulting in stale UI.

error.invalid-exhaustive-deps.ts:10:11
   8 |   }, [x?.y.z?.a.b]);
   9 |   const b = useMemo(() => {
> 10 |     return x.y.z?.a;
     |            ^^^^^^^^ Missing dependency `x.y.z?.a`
  11 |   }, [x.y.z.a]);
  12 |   const c = useMemo(() => {
  13 |     return x?.y.z.a?.b;

Error: Found non-exhaustive dependencies

Missing dependencies can cause a value not to update when those inputs change, resulting in stale UI.

error.invalid-exhaustive-deps.ts:13:11
  11 |   }, [x.y.z.a]);
  12 |   const c = useMemo(() => {
> 13 |     return x?.y.z.a?.b;
     |            ^^^^^^^^^^^ Missing dependency `x?.y.z.a?.b`
  14 |   }, [x?.y.z.a?.b.z]);
  15 |   const d = useMemo(() => {
  16 |     return x?.y?.[(console.log(y), z?.b)];

Error: Found unnecessary memoization dependencies

Unnecessary dependencies can cause a value to update more often than necessary, which can cause effects to run more than expected.

error.invalid-exhaustive-deps.ts:25:5
  23 |   const f = useMemo(() => {
  24 |     return [];
> 25 |   }, [x, y.z, z?.y?.a, UNUSED_GLOBAL]);
     |      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Unnecessary dependencies `x`, `y.z`, `z?.y?.a`, `UNUSED_GLOBAL`
  26 |   const ref1 = useRef(null);
  27 |   const ref2 = useRef(null);
  28 |   const ref = z ? ref1 : ref2;

Error: Found non-exhaustive dependencies

Missing dependencies can cause a value not to update when those inputs change, resulting in stale UI.

error.invalid-exhaustive-deps.ts:31:13
  29 |   const cb = useMemo(() => {
  30 |     return () => {
> 31 |       return ref.current;
     |              ^^^ Missing dependency `ref`. Refs, setState functions, and other "stable" values generally do not need to be added as dependencies, but this variable may change over time to point to different values
  32 |     };
  33 |   }, []);
  34 |   return <Stringify results={[a, b, c, d, e, f, cb]} />;
```
          
      