
## Input

```javascript
// @inferEffectDependencies
import {AUTODEPS} from 'react';
import useEffectWrapper from 'useEffectWrapper';

function Component({foo}) {
  useEffectWrapper(
    () => {
      console.log(foo);
    },
    [foo],
    AUTODEPS
  );
}

```


## Error

```
   4 |
   5 | function Component({foo}) {
>  6 |   useEffectWrapper(
     |   ^^^^^^^^^^^^^^^^^
>  7 |     () => {
     | ^^^^^^^^^^^
>  8 |       console.log(foo);
     | ^^^^^^^^^^^
>  9 |     },
     | ^^^^^^^^^^^
> 10 |     [foo],
     | ^^^^^^^^^^^
> 11 |     AUTODEPS
     | ^^^^^^^^^^^
> 12 |   );
     | ^^^^ InvalidReact: [InferEffectDependencies] React Compiler is unable to infer dependencies of this effect. This will break your build! To resolve, either pass your own dependency array or fix reported compiler bailout diagnostics. (6:12)
  13 | }
  14 |
```
          
      