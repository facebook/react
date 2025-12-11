
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
Found 13 errors:

Todo: Important source location missing in generated code

Source location for VariableDeclarator is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:5:8
  3 |
  4 | function Component({prop1, prop2}) {
> 5 |   const x = prop1 + prop2;
    |         ^^^^^^^^^^^^^^^^^
  6 |   const y = x * 2;
  7 |   const arr = [x, y];
  8 |   const obj = {x, y};

Todo: Important source location missing in generated code

Source location for VariableDeclarator is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:6:8
  4 | function Component({prop1, prop2}) {
  5 |   const x = prop1 + prop2;
> 6 |   const y = x * 2;
    |         ^^^^^^^^^
  7 |   const arr = [x, y];
  8 |   const obj = {x, y};
  9 |   const [a, b] = arr;

Todo: Important source location missing in generated code

Source location for VariableDeclarator is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:7:8
   5 |   const x = prop1 + prop2;
   6 |   const y = x * 2;
>  7 |   const arr = [x, y];
     |         ^^^^^^^^^^^^
   8 |   const obj = {x, y};
   9 |   const [a, b] = arr;
  10 |   const {x: c, y: d} = obj;

Todo: Important source location missing in generated code

Source location for VariableDeclarator is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:8:8
   6 |   const y = x * 2;
   7 |   const arr = [x, y];
>  8 |   const obj = {x, y};
     |         ^^^^^^^^^^^^
   9 |   const [a, b] = arr;
  10 |   const {x: c, y: d} = obj;
  11 |

Todo: Important source location missing in generated code

Source location for VariableDeclarator is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:9:8
   7 |   const arr = [x, y];
   8 |   const obj = {x, y};
>  9 |   const [a, b] = arr;
     |         ^^^^^^^^^^^^
  10 |   const {x: c, y: d} = obj;
  11 |
  12 |   useEffect(() => {

Todo: Important source location missing in generated code

Source location for VariableDeclarator is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:10:8
   8 |   const obj = {x, y};
   9 |   const [a, b] = arr;
> 10 |   const {x: c, y: d} = obj;
     |         ^^^^^^^^^^^^^^^^^^
  11 |
  12 |   useEffect(() => {
  13 |     if (a > 10) {

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

Source location for VariableDeclarator is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:18:8
  16 |   }, [a]);
  17 |
> 18 |   const foo = useCallback(() => {
     |         ^^^^^^^^^^^^^^^^^^^^^^^^^
> 19 |     return a + b;
     | ^^^^^^^^^^^^^^^^^
> 20 |   }, [a, b]);
     | ^^^^^^^^^^^^^
  21 |
  22 |   function bar() {
  23 |     return (c + d) * 2;

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
          
      