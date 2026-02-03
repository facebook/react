function Foo({items}) {
  const results = [];
  try {
    for (let i = 0; i < items.length; i++) {
      results.push(items[i]);
    }
  } catch (e) {
    return <span>Error</span>;
  }
  return <span>{results.join(', ')}</span>;
}
