function Component(props) {
  const user = useFragment(
    graphql`fragment Component_user on User { ... }`,
    props.user
  );
  const posts = user.timeline.posts.edges.nodes.map((node) => (
    <Post post={node} />
  ));
  posts.push({});
  const count = posts.length;
  foo(count);
  return <>{posts}</>;
}
