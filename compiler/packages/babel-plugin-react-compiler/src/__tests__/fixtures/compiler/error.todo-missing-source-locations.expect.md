
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
  let sound;

  if (y > 10) {
    sound = 'woof';
  } else {
    sound = 'meow';
  }

  useEffect(() => {
    if (a > 10) {
      console.log(a);
      console.log(sound);
    }
  }, [a, sound]);

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
Found 22 errors:

Todo: Important source location missing in generated code

Source location for Identifier is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:4:9
  2 | import {useEffect, useCallback} from 'react';
  3 |
> 4 | function Component({prop1, prop2}) {
    |          ^^^^^^^^^
  5 |   const x = prop1 + prop2;
  6 |   const y = x * 2;
  7 |   const arr = [x, y];

Todo: Important source location missing in generated code

Source location for Identifier is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:10:9
   8 |   const obj = {x, y};
   9 |   const [a, b] = arr;
> 10 |   const {x: c, y: d} = obj;
     |          ^
  11 |   let sound;
  12 |
  13 |   if (y > 10) {

Todo: Important source location missing in generated code

Source location for Identifier is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:10:15
   8 |   const obj = {x, y};
   9 |   const [a, b] = arr;
> 10 |   const {x: c, y: d} = obj;
     |                ^
  11 |   let sound;
  12 |
  13 |   if (y > 10) {

Todo: Important source location missing in generated code

Source location for VariableDeclaration is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:11:2
   9 |   const [a, b] = arr;
  10 |   const {x: c, y: d} = obj;
> 11 |   let sound;
     |   ^^^^^^^^^^
  12 |
  13 |   if (y > 10) {
  14 |     sound = 'woof';

Todo: Important source location missing in generated code

Source location for VariableDeclarator is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:11:6
   9 |   const [a, b] = arr;
  10 |   const {x: c, y: d} = obj;
> 11 |   let sound;
     |       ^^^^^
  12 |
  13 |   if (y > 10) {
  14 |     sound = 'woof';

Todo: Important source location missing in generated code

Source location for ExpressionStatement is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:14:4
  12 |
  13 |   if (y > 10) {
> 14 |     sound = 'woof';
     |     ^^^^^^^^^^^^^^^
  15 |   } else {
  16 |     sound = 'meow';
  17 |   }

Todo: Important source location has wrong node type in generated code

Source location for Identifier exists in the generated output but with wrong node type(s): ExpressionStatement. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:14:4
  12 |
  13 |   if (y > 10) {
> 14 |     sound = 'woof';
     |     ^^^^^
  15 |   } else {
  16 |     sound = 'meow';
  17 |   }

Todo: Important source location missing in generated code

Source location for ExpressionStatement is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:16:4
  14 |     sound = 'woof';
  15 |   } else {
> 16 |     sound = 'meow';
     |     ^^^^^^^^^^^^^^^
  17 |   }
  18 |
  19 |   useEffect(() => {

Todo: Important source location has wrong node type in generated code

Source location for Identifier exists in the generated output but with wrong node type(s): ExpressionStatement. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:16:4
  14 |     sound = 'woof';
  15 |   } else {
> 16 |     sound = 'meow';
     |     ^^^^^
  17 |   }
  18 |
  19 |   useEffect(() => {

Todo: Important source location missing in generated code

Source location for ExpressionStatement is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:19:2
  17 |   }
  18 |
> 19 |   useEffect(() => {
     |   ^^^^^^^^^^^^^^^^^
> 20 |     if (a > 10) {
     | ^^^^^^^^^^^^^^^^^
> 21 |       console.log(a);
     | ^^^^^^^^^^^^^^^^^
> 22 |       console.log(sound);
     | ^^^^^^^^^^^^^^^^^
> 23 |     }
     | ^^^^^^^^^^^^^^^^^
> 24 |   }, [a, sound]);
     | ^^^^^^^^^^^^^^^^^^
  25 |
  26 |   const foo = useCallback(() => {
  27 |     return a + b;

Todo: Important source location missing in generated code

Source location for ExpressionStatement is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:21:6
  19 |   useEffect(() => {
  20 |     if (a > 10) {
> 21 |       console.log(a);
     |       ^^^^^^^^^^^^^^^
  22 |       console.log(sound);
  23 |     }
  24 |   }, [a, sound]);

Todo: Important source location missing in generated code

Source location for Identifier is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:21:14
  19 |   useEffect(() => {
  20 |     if (a > 10) {
> 21 |       console.log(a);
     |               ^^^
  22 |       console.log(sound);
  23 |     }
  24 |   }, [a, sound]);

Todo: Important source location missing in generated code

Source location for ExpressionStatement is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:22:6
  20 |     if (a > 10) {
  21 |       console.log(a);
> 22 |       console.log(sound);
     |       ^^^^^^^^^^^^^^^^^^^
  23 |     }
  24 |   }, [a, sound]);
  25 |

Todo: Important source location missing in generated code

Source location for Identifier is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:22:14
  20 |     if (a > 10) {
  21 |       console.log(a);
> 22 |       console.log(sound);
     |               ^^^
  23 |     }
  24 |   }, [a, sound]);
  25 |

Todo: Important source location missing in generated code

Source location for Identifier is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:26:14
  24 |   }, [a, sound]);
  25 |
> 26 |   const foo = useCallback(() => {
     |               ^^^^^^^^^^^
  27 |     return a + b;
  28 |   }, [a, b]);
  29 |

Todo: Important source location missing in generated code

Source location for ReturnStatement is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:27:4
  25 |
  26 |   const foo = useCallback(() => {
> 27 |     return a + b;
     |     ^^^^^^^^^^^^^
  28 |   }, [a, b]);
  29 |
  30 |   function bar() {

Todo: Important source location missing in generated code

Source location for Identifier is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:28:6
  26 |   const foo = useCallback(() => {
  27 |     return a + b;
> 28 |   }, [a, b]);
     |       ^
  29 |
  30 |   function bar() {
  31 |     return (c + d) * 2;

Todo: Important source location missing in generated code

Source location for Identifier is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:28:9
  26 |   const foo = useCallback(() => {
  27 |     return a + b;
> 28 |   }, [a, b]);
     |          ^
  29 |
  30 |   function bar() {
  31 |     return (c + d) * 2;

Todo: Important source location missing in generated code

Source location for ReturnStatement is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:31:4
  29 |
  30 |   function bar() {
> 31 |     return (c + d) * 2;
     |     ^^^^^^^^^^^^^^^^^^^
  32 |   }
  33 |
  34 |   console.log('Hello, world!');

Todo: Important source location missing in generated code

Source location for ExpressionStatement is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:34:2
  32 |   }
  33 |
> 34 |   console.log('Hello, world!');
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  35 |
  36 |   return [y, foo, bar];
  37 | }

Todo: Important source location missing in generated code

Source location for Identifier is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:34:10
  32 |   }
  33 |
> 34 |   console.log('Hello, world!');
     |           ^^^
  35 |
  36 |   return [y, foo, bar];
  37 | }

Todo: Important source location missing in generated code

Source location for ReturnStatement is missing in the generated output. This can cause coverage instrumentation to fail to track this code properly, resulting in inaccurate coverage reports..

error.todo-missing-source-locations.ts:36:2
  34 |   console.log('Hello, world!');
  35 |
> 36 |   return [y, foo, bar];
     |   ^^^^^^^^^^^^^^^^^^^^^
  37 | }
  38 |
```
          
      