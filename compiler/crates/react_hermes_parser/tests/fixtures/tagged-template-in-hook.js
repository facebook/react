function Component(props) {
  const user = useFragment(graphql`fragment on User { name }`, props.user);
  return user.name;
}
