
## Input

```javascript
// @enableEmitStructuredHooks @target:"18"

import {useState} from 'react';

function makeLabel() {
  'use structured hooks';

  const [label] = useState('Ada');
  return label;
}

export const FIXTURE_ENTRYPOINT = {
  fn: makeLabel,
  params: [],
};
```


## Error

```
Found 1 error:

Todo: Structured hooks prototype only supports React components and custom hooks.

error.todo-non-react-function.ts:5:0
   3 | import {useState} from 'react';
   4 |
>  5 | function makeLabel() {
     | ^^^^^^^^^^^^^^^^^^^^^^
>  6 |   'use structured hooks';
     | ^^^^^^^^^^^^^^^^^^^^^^^^^
>  7 |
     | ^^^^^^^^^^^^^^^^^^^^^^^^^
>  8 |   const [label] = useState('Ada');
     | ^^^^^^^^^^^^^^^^^^^^^^^^^
>  9 |   return label;
     | ^^^^^^^^^^^^^^^^^^^^^^^^^
> 10 | }
     | ^^ Structured hooks prototype only supports React components and custom hooks.
  11 |
  12 | export const FIXTURE_ENTRYPOINT = {
  13 |   fn: makeLabel,
```
          
      