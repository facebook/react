function Component(props) {
  const user = useFragment(graphql`...`, props.user) ?? {};
  return user.name;
}
