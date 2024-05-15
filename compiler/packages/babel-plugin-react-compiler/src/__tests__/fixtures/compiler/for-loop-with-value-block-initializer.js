const TOTAL = 10;
function Component(props) {
  const items = [];
  for (let i = props.start ?? 0; i < props.items.length; i++) {
    const item = props.items[i];
    items.push(<div key={item.id}>{item.value}</div>);
  }
  return <div>{items}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      start: null,
      items: [
        { id: 0, value: "zero" },
        { id: 1, value: "one" },
      ],
    },
  ],
};
