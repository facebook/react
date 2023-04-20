function Component(props) {
  let Tag = View;
  return (
    <Tag>
      {((Tag = HScroll), props.value)}
      <Tag />
    </Tag>
  );
}
