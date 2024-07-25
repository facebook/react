
## Input

```javascript
function Component(props) {
  return <View {...props} />;
}

const View = React.memo(({items}) => {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
});

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      items: [
        {id: 2, name: 'foo'},
        {id: 3, name: 'bar'},
      ],
    },
  ],
};

```


## Error

```
   3 | }
   4 |
>  5 | const View = React.memo(({items}) => {
     |                         ^^^^^^^^^^^^^^
>  6 |   return (
     | ^^^^^^^^^^
>  7 |     <ul>
     | ^^^^^^^^^^
>  8 |       {items.map(item => (
     | ^^^^^^^^^^
>  9 |         <li key={item.id}>{item.name}</li>
     | ^^^^^^^^^^
> 10 |       ))}
     | ^^^^^^^^^^
> 11 |     </ul>
     | ^^^^^^^^^^
> 12 |   );
     | ^^^^^^^^^^
> 13 | });
     | ^^ Invariant: Expected a variable declarator parent (5:13)
  14 |
  15 | export const FIXTURE_ENTRYPOINT = {
  16 |   fn: Component,
```
          
      