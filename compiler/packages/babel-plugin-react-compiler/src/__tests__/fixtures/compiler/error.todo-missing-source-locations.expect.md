
## Input

```javascript
// @validateSourceLocations
import {useEffect, useCallback} from 'react';

function Component({prop1, prop2}) {
  const x = prop1 + prop2;
  const y = x * 2;
  const arr = [x, y];
  const obj = {x, y};
  const [a, b] = arr;
  const {x: c, y: d} = obj;

  useEffect(() => {
    if (a > 10) {
      console.log(a);
    }
  }, [a]);

  const foo = useCallback(() => {
    return a + b;
  }, [a, b]);

  function bar() {
    return (c + d) * 2;
  }

  console.log('Hello, world!');

  return [y, foo, bar];
}

```


## Error

```
Found 6 errors:

Todo: Important source location missing in generated code

Source location for ExpressionStatement is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:12:2
  10 |   const {x: c, y: d} = obj;
  11 |
> 12 |   useEffect(() => {
     |   ^^^^^^^^^^^^^^^^^
> 13 |     if (a > 10) {
     | ^^^^^^^^^^^^^^^^^
> 14 |       console.log(a);
     | ^^^^^^^^^^^^^^^^^
> 15 |     }
     | ^^^^^^^^^^^^^^^^^
> 16 |   }, [a]);
     | ^^^^^^^^^^^
  17 |
  18 |   const foo = useCallback(() => {
  19 |     return a + b;

Todo: Important source location missing in generated code

Source location for ExpressionStatement is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:14:6
  12 |   useEffect(() => {
  13 |     if (a > 10) {
> 14 |       console.log(a);
     |       ^^^^^^^^^^^^^^^
  15 |     }
  16 |   }, [a]);
  17 |

Todo: Important source location missing in generated code

Source location for ReturnStatement is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:19:4
  17 |
  18 |   const foo = useCallback(() => {
> 19 |     return a + b;
     |     ^^^^^^^^^^^^^
  20 |   }, [a, b]);
  21 |
  22 |   function bar() {

Todo: Important source location missing in generated code

Source location for ReturnStatement is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:23:4
  21 |
  22 |   function bar() {
> 23 |     return (c + d) * 2;
     |     ^^^^^^^^^^^^^^^^^^^
  24 |   }
  25 |
  26 |   console.log('Hello, world!');

Todo: Important source location missing in generated code

Source location for ExpressionStatement is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:26:2
  24 |   }
  25 |
> 26 |   console.log('Hello, world!');
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  27 |
  28 |   return [y, foo, bar];
  29 | }

Todo: Important source location missing in generated code

Source location for ReturnStatement is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:28:2
  26 |   console.log('Hello, world!');
  27 |
> 28 |   return [y, foo, bar];
     |   ^^^^^^^^^^^^^^^^^^^^^
  29 | }
  30 |
```
          
      