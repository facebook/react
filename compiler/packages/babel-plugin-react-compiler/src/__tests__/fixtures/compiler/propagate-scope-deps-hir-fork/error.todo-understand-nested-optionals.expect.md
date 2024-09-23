
## Input

```javascript
// @enablePropagateDepsInHIR

import {identity} from 'shared-runtime';

/**
 * identity(...)?.toString() is the outer optional, and data?.value is the inner
 * one.
 *
 * We currently bail out here because we recursively traverse all optionals
 * reachable from the outer one (and accidentally visit data?.value).
 *
 * TODO: support nested optionals by improving how we traverse optional value
 * blocks
 */
function Foo({data}: {data: null | {value: number}}) {
  return identity(data?.value)?.toString();
}

```


## Error

```
  14 |  */
  15 | function Foo({data}: {data: null | {value: number}}) {
> 16 |   return identity(data?.value)?.toString();
     |          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Todo: [OptionalChainDeps] Support nested optional-chaining. Value written to from inner optional 26 (data$21?.value), value tested by outer optional 33 (16:16)
  17 | }
  18 |
```
          
      