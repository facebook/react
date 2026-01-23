function Component(props) {
  const results = [];
  for (const item of props.items) {
    try {
      if (item === 'skip') {
        continue;
      }
      if (item === 'stop') {
        break;
      }
      results.push(item);
    } finally {
      console.log('processed', item);
    }
  }
  return results;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{items: ['a', 'skip', 'b', 'stop', 'c']}],
};
