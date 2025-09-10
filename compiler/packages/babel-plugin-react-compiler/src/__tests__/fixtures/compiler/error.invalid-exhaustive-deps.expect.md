
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
  return <Stringify results={[a, b, c, d, e]} />;
}

```


## Error

```
Found 3 errors:

Compilation Skipped: Found missing memoization dependency

Missing dependencies can cause a value not to update when those inputs change, resulting in stale UI. This memoization cannot be safely rewritten by the compiler..

error.invalid-exhaustive-deps.ts:7:11
   5 | function Component({x, y, z}) {
   6 |   const a = useMemo(() => {
>  7 |     return x?.y.z?.a;
     |            ^^^^^^^^^ Missing dependency Local x$181?.y.z?.a
   8 |   }, [x?.y.z?.a.b]);
   9 |   const b = useMemo(() => {
  10 |     return x.y.z?.a;

Found similar dependency `x$181?.y.z?.a.b`

Compilation Skipped: Found missing memoization dependency

Missing dependencies can cause a value not to update when those inputs change, resulting in stale UI. This memoization cannot be safely rewritten by the compiler..

error.invalid-exhaustive-deps.ts:10:11
   8 |   }, [x?.y.z?.a.b]);
   9 |   const b = useMemo(() => {
> 10 |     return x.y.z?.a;
     |            ^^^^^^^^ Missing dependency Local x$181.y.z?.a
  11 |   }, [x.y.z.a]);
  12 |   const c = useMemo(() => {
  13 |     return x?.y.z.a?.b;

Found similar dependency `x$181.y.z.a`

Compilation Skipped: Found missing memoization dependency

Missing dependencies can cause a value not to update when those inputs change, resulting in stale UI. This memoization cannot be safely rewritten by the compiler..

error.invalid-exhaustive-deps.ts:13:11
  11 |   }, [x.y.z.a]);
  12 |   const c = useMemo(() => {
> 13 |     return x?.y.z.a?.b;
     |            ^^^^^^^^^^^ Missing dependency Local x$181?.y.z.a?.b
  14 |   }, [x?.y.z.a?.b.z]);
  15 |   const d = useMemo(() => {
  16 |     return x?.y?.[(console.log(y), z?.b)];

Found similar dependency `x$181?.y.z.a?.b.z`
```
          
      