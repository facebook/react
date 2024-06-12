function Component(props) {
  const item = useFragment(graphql`...`, props.item);
  return item.items?.map((item) => renderItem(item)) ?? [];
}
