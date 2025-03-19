
## Input

```javascript
// @validateStaticComponents
function Example(props) {
  function Component() {
    return <div />;
  }
  return <Component />;
}

```


## Error

```
  4 |     return <div />;
  5 |   }
> 6 |   return <Component />;
    |           ^^^^^^^^^ InvalidReact: Components created during render will reset their state each time they are created. Declare components outside of render.  (6:6)

InvalidReact: The component may be created during render (3:5)
  7 | }
  8 |
```
          
      