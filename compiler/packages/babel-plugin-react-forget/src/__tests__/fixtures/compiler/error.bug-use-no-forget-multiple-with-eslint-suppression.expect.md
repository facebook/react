
## Input

```javascript
const useControllableState = (options) => {};
function NoopComponent() {}

function Component() {
  "use no forget";
  const ref = useRef(null);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  ref.current = "bad";
  return <MyButton ref={ref} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```


## Error

```
[ReactForget] InvalidReact: React Forget has bailed out of optimizing this component as one or more React eslint rules were disabled. React Forget only works when your components follow all the rules of React, disabling them may result in undefined behavior. eslint-disable-next-line react-hooks/rules-of-hooks (7:7)
```
          
      