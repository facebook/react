
## Input

```javascript
function Component(props) {
  const user = useFragment(graphql`...`, props.user) ?? {};
  return user.name;
}

```

## Code

```javascript
function Component(props) {
  const user = useFragment(graphql`...`, props.user) ?? {};
  return user.name;
}

```
      