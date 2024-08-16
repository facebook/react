
## Input

```javascript
function Component(props) {
  let el;
  try {
    el = <div />;
  } finally {
    console.log(el);
  }
  return el;
}

```


## Error

```
   1 | function Component(props) {
   2 |   let el;
>  3 |   try {
     |   ^^^^^
>  4 |     el = <div />;
     | ^^^^^^^^^^^^^^^^^
>  5 |   } finally {
     | ^^^^^^^^^^^^^^^^^
>  6 |     console.log(el);
     | ^^^^^^^^^^^^^^^^^
>  7 |   }
     | ^^^^ Todo: (BuildHIR::lowerStatement) Handle TryStatement without a catch clause (3:7)
   8 |   return el;
   9 | }
  10 |
```
          
      