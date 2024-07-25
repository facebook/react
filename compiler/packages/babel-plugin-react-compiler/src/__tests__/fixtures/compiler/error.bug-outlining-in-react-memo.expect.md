
## Input

```javascript
const View = React.memo(({items}) => {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
});

```


## Error

```
>  1 | const View = React.memo(({items}) => {
     |                         ^^^^^^^^^^^^^^
>  2 |   return (
     | ^^^^^^^^^^
>  3 |     <ul>
     | ^^^^^^^^^^
>  4 |       {items.map(item => (
     | ^^^^^^^^^^
>  5 |         <li key={item.id}>{item.name}</li>
     | ^^^^^^^^^^
>  6 |       ))}
     | ^^^^^^^^^^
>  7 |     </ul>
     | ^^^^^^^^^^
>  8 |   );
     | ^^^^^^^^^^
>  9 | });
     | ^^ Invariant: Expected a variable declarator parent (1:9)
  10 |
```
          
      