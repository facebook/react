
## Input

```javascript
// @validateStaticComponents
function Example(props) {
  let Component;
  if (props.cond) {
    Component = createComponent();
  } else {
    Component = DefaultComponent;
  }
  return <Component />;
}

```


## Error

```
   7 |     Component = DefaultComponent;
   8 |   }
>  9 |   return <Component />;
     |           ^^^^^^^^^ InvalidReact: Components created during render will reset their state each time they are created. Declare components outside of render.  (9:9)

InvalidReact: The component may be created during render (5:5)
  10 | }
  11 |
```
          
      