
## Input

```javascript
import {identity} from 'shared-runtime';

function Component(props) {
  let el;
  try {
    let value;
    try {
      value = identity(props.foo);
    } catch {
      el = <div value={value} />;
    }
  } finally {
    console.log(el);
  }
  return el;
}

```


## Error

```
   3 | function Component(props) {
   4 |   let el;
>  5 |   try {
     |   ^^^^^
>  6 |     let value;
     | ^^^^^^^^^^^^^^
>  7 |     try {
     | ^^^^^^^^^^^^^^
>  8 |       value = identity(props.foo);
     | ^^^^^^^^^^^^^^
>  9 |     } catch {
     | ^^^^^^^^^^^^^^
> 10 |       el = <div value={value} />;
     | ^^^^^^^^^^^^^^
> 11 |     }
     | ^^^^^^^^^^^^^^
> 12 |   } finally {
     | ^^^^^^^^^^^^^^
> 13 |     console.log(el);
     | ^^^^^^^^^^^^^^
> 14 |   }
     | ^^^^ Todo: (BuildHIR::lowerStatement) Handle TryStatement without a catch clause (5:14)
  15 |   return el;
  16 | }
  17 |
```
          
      