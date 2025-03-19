
## Input

```javascript
// @validateStaticComponents
function Example(props) {
  const Component = createComponent();
  return <Component />;
}

```


## Error

```
  2 | function Example(props) {
  3 |   const Component = createComponent();
> 4 |   return <Component />;
    |           ^^^^^^^^^ InvalidReact: Components created during render will reset their state each time they are created. Declare components outside of render.  (4:4)

InvalidReact: The component may be created during render (3:3)
  5 | }
  6 |
```
          
      