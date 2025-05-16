
## Input

```javascript
// @dynamicGating:{"source":"shared-runtime"} @panicThreshold:"none" @inferEffectDependencies
import {useEffect} from 'react';
import {print} from 'shared-runtime';

function ReactiveVariable({propVal}) {
  'use memo if(invalid identifier)';
  const arr = [propVal];
  useEffect(() => print(arr));
}

export const FIXTURE_ENTRYPOINT = {
  fn: ReactiveVariable,
  params: [{}],
};

```


## Error

```
   6 |   'use memo if(invalid identifier)';
   7 |   const arr = [propVal];
>  8 |   useEffect(() => print(arr));
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^ InvalidReact: [InferEffectDependencies] React Compiler is unable to infer dependencies of this effect. This will break your build! To resolve, either pass your own dependency array or fix reported compiler bailout diagnostics. (8:8)
   9 | }
  10 |
  11 | export const FIXTURE_ENTRYPOINT = {
```
          
      