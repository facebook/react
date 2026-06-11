function Component(props) {
  const cells = props.items.flatMap(item => [item, item.id + props.suffix]);
  return (
    <div>
      {cells.map((cell, i) => (
        <span key={i}>{typeof cell === 'object' ? cell.id : cell}</span>
      ))}
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      items: [{id: 1}, {id: 2}],
      suffix: '-x',
    },
  ],
  isComponent: true,
};
