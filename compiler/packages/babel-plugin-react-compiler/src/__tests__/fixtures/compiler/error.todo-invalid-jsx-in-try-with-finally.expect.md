
## Input

```javascript
// @validateNoJSXInTryStatements
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
   2 | function Component(props) {
   3 |   let el;
>  4 |   try {
     |   ^^^^^
>  5 |     el = <div />;
     | ^^^^^^^^^^^^^^^^^
>  6 |   } finally {
     | ^^^^^^^^^^^^^^^^^
>  7 |     console.log(el);
     | ^^^^^^^^^^^^^^^^^
>  8 |   }
     | ^^^^ Todo: (BuildHIR::lowerStatement) Handle TryStatement without a catch clause (4:8)
   9 |   return el;
  10 | }
  11 |
```
          
      