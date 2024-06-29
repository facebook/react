function Component(props) {
  const collection = [makeObject()];
  const results = [];
  for (const item of collection) {
    results.push(<div>{mutate(item)}</div>);
  }
  return <div>{results}</div>;
}
